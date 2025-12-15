// app/api/webhooks/lemonsqueezy/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminSupabase } from "@/utils/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  // 1) 서명 검증
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");

  if (signature !== digest) {
    console.error("Invalid Lemon Squeezy signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2) payload 파싱
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    console.error("Failed to parse webhook JSON:", e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName: string | undefined = payload?.meta?.event_name;

  // 일단 order_created만 처리
  if (eventName !== "order_created") {
    return NextResponse.json({ ok: true });
  }

  const data = payload.data;
  const attributes = data?.attributes ?? {};
  const custom =
    attributes.custom ||
    attributes.meta?.custom ||
    {};

    const userId = custom.user_id as string | undefined;
    const packId = custom.pack_id as string | undefined;
    
  if (!userId || !packId) {
    console.error("Missing userId or packCode in Lemon Squeezy custom data", {
      userId,
      packId,
    });
    return NextResponse.json(
      { error: "Missing custom data" },
      { status: 400 }
    );
  }

  const supabase = adminSupabase;

  // 3) webhook raw 로그 저장 (event_type 컬럼!)
  try {
    await supabase.from("payment_webhook_logs").insert({
      provider: "lemon_squeezy",              // payment_provider enum
      event_type: eventName ?? "order_created",
      payload,                                // jsonb
      received_at: new Date().toISOString(),  // optional
    });
  } catch (e) {
    console.error("Failed to log webhook:", (e as Error).message);
    // 로그 실패는 치명적이진 않으니 계속 진행
  }

  // 4) credit_packs에서 packCode에 해당하는 상품 찾기
  // 👉 여기서는 packCode를 credit_packs.id 와 매핑한다고 가정
  const { data: pack, error: packError } = await supabase
    .from("credit_packs")
    .select("id, display_name, credits, currency, price, is_active")
    .eq("id", packId)
    .eq("is_active", true)
    .single();

  if (packError || !pack) {
    console.error(
      "Credit pack not found for id (packCode):",
      packId,
      packError?.message
    );
    return NextResponse.json({ error: "Unknown pack" }, { status: 400 });
  }

  // 5) payments 테이블에 결제 기록 추가
  // amount: 일반적으로 LemonSqueezy는 센트 단위, DB 설계에 맞게 사용
  const amount = Number(
    attributes.total ??
      attributes.subtotal ??
      pack.price ??
      0
  );

  // currency: enum "krw" | "usd" => pack.currency 그대로 사용
  const currency = pack.currency; // 여기서 타입이 이미 "krw" | "usd"

  const identifier: string | undefined = attributes.identifier; // Lemon 주문 식별자
  const orderId: string | undefined = data?.id;

  // customer id/email 같은 건 있으면 넣고, 없어도 null 가능
  const providerCustomerId: string | null =
    (attributes.user_email as string | undefined) ??
    (attributes.customer_email as string | undefined) ??
    null;

  const {
    data: payment,
    error: paymentError,
  } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      provider: "lemon_squeezy",                         // payment_provider enum
      provider_order_id: identifier ?? orderId ?? "",    // 🔹 필수 필드
      provider_customer_id: providerCustomerId,          // string | null
      status: "paid",                                    // payment_status enum 안에 "paid"가 있다고 가정
      amount,
      currency,                                          // "krw" | "usd"
      credits: pack.credits,
      credit_pack_id: pack.id,
      raw_payload: payload,
      // receipt_url, paid_at 등은 나중에 필요하면 추가로 세팅
    })
    .select()
    .single();

  if (paymentError || !payment) {
    console.error("Failed to insert payment:", paymentError?.message);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }

  // 6) 프로필 잔액 조회
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits_paid, credits_free")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error(
      "Profile not found for user:",
      userId,
      profileError?.message
    );
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 500 }
    );
  }

  const currentPaid = profile.credits_paid ?? 0;
  const currentFree = profile.credits_free ?? 0;
  const newPaid = currentPaid + pack.credits;
  const newFree = currentFree;
  const newTotal = newPaid + newFree;

  // 7) profiles 업데이트
  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({
      credits_paid: newPaid,
    })
    .eq("id", userId);

  if (updateProfileError) {
    console.error(
      "Failed to update profile credits:",
      updateProfileError.message
    );
    return NextResponse.json(
      { error: "Failed to update balance" },
      { status: 500 }
    );
  }

  // 8) credit_transactions 기록
  const { error: txError } = await supabase
    .from("credit_transactions")
    .insert({
      user_id: userId,
      tx_type: "purchase",          // credit_transaction_type enum
      source: "lemon_squeezy",      // credit_transaction_source enum 에 이 값이 있어야 함
      delta_total: pack.credits,
      delta_paid: pack.credits,
      delta_free: 0,
      balance_total_after: newTotal,
      balance_paid_after: newPaid,
      balance_free_after: newFree,
      payment_id: payment.id,
      reason: `LemonSqueezy order ${identifier ?? orderId ?? ""}`,
    });

  if (txError) {
    console.error("Failed to insert credit transaction:", txError.message);
    // 여기서 실패해도 크레딧은 이미 올린 상태라 200은 보내는 게 낫다
  }

  return NextResponse.json({ ok: true });
}
