import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";

function verifySignature(rawBody: string, signature: string, secret: string) {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const actual = Buffer.from(signature || "", "utf8");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export async function handleLemonSqueezyWebhook(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("Lemon webhook secret is not set");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  if (!verifySignature(rawBody, signature, secret)) {
    console.error("Invalid Lemon Squeezy signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error("Failed to parse Lemon webhook JSON:", error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName: string | undefined = payload?.meta?.event_name;
  const data = payload?.data;
  const attributes = data?.attributes ?? {};
  const orderId: string | undefined = data?.id;
  const identifier: string | undefined = attributes.identifier;

  console.info("[LEMON WEBHOOK] received", {
    eventName,
    orderId,
    identifier,
    testMode: payload?.meta?.test_mode ?? null,
  });

  const supabase = adminSupabase;

  try {
    await supabase.from("payment_webhook_logs").insert({
      provider: "lemon_squeezy",
      event_type: eventName ?? "unknown",
      payload,
      received_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log Lemon webhook:", (error as Error).message);
  }

  if (eventName !== "order_created") {
    console.info("[LEMON WEBHOOK] ignored event", { eventName, orderId, identifier });
    return NextResponse.json({ ok: true });
  }

  const custom =
    attributes.custom ||
    attributes.meta?.custom ||
    attributes.checkout_data?.custom ||
    payload?.meta?.custom_data ||
    {};

  const userId =
    (custom.user_id as string | undefined) ||
    (custom.userId as string | undefined);
  const packId =
    (custom.pack_id as string | undefined) ||
    (custom.pack_code as string | undefined) ||
    (custom.packId as string | undefined) ||
    (custom.packCode as string | undefined);
  const lemonVariantId =
    (attributes.first_order_item?.variant_id as string | undefined) ||
    (attributes.variant_id as string | undefined);

  if (!userId || (!packId && !lemonVariantId)) {
    console.error("Missing userId or pack identifier in Lemon Squeezy custom data", {
      eventName,
      orderId,
      identifier,
      userId,
      packId,
      lemonVariantId,
      custom,
    });
    return NextResponse.json(
      { error: "Missing custom data" },
      { status: 400 }
    );
  }

  const providerOrderId = identifier ?? orderId ?? "";

  if (!providerOrderId) {
    console.error("Missing Lemon order identifier", { eventName, orderId, identifier });
    return NextResponse.json({ error: "Missing order identifier" }, { status: 400 });
  }

  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from("payments")
    .select("id, status")
    .eq("provider", "lemon_squeezy")
    .eq("provider_order_id", providerOrderId)
    .maybeSingle();

  if (existingPaymentError) {
    console.error(
      "Failed to check existing Lemon payment:",
      providerOrderId,
      existingPaymentError.message
    );
    return NextResponse.json(
      { error: "Failed to inspect payment" },
      { status: 500 }
    );
  }

  if (existingPayment?.status === "paid") {
    console.info("[LEMON WEBHOOK] duplicate order ignored", {
      providerOrderId,
      paymentId: existingPayment.id,
    });
    return NextResponse.json({ ok: true });
  }

  let packQuery = supabase
    .from("credit_packs")
    .select("id, display_name, credits, currency, price, is_active, lemon_variant_id")
    .eq("is_active", true);

  if (packId && lemonVariantId) {
    packQuery = packQuery.or(`id.eq.${packId},lemon_variant_id.eq.${lemonVariantId}`);
  } else if (packId) {
    packQuery = packQuery.eq("id", packId);
  } else {
    packQuery = packQuery.eq("lemon_variant_id", lemonVariantId ?? "");
  }

  const { data: pack, error: packError } = await packQuery.single();

  if (packError || !pack) {
    console.error(
      "Credit pack not found for Lemon Squeezy purchase:",
      packId,
      lemonVariantId,
      packError?.message
    );
    return NextResponse.json({ error: "Unknown pack" }, { status: 400 });
  }

  const amount = Number(attributes.total ?? attributes.subtotal ?? pack.price ?? 0);
  const currency = pack.currency;
  const providerCustomerId: string | null =
    (attributes.user_email as string | undefined) ??
    (attributes.customer_email as string | undefined) ??
    null;

  let paymentId = existingPayment?.id ?? null;

  if (existingPayment) {
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        status: "paid",
        amount,
        currency,
        credits: pack.credits,
        credit_pack_id: pack.id,
        provider_customer_id: providerCustomerId,
        raw_payload: payload,
      })
      .eq("id", existingPayment.id);

    if (updatePaymentError) {
      console.error("Failed to update existing Lemon payment:", updatePaymentError.message);
      return NextResponse.json(
        { error: "Failed to record payment" },
        { status: 500 }
      );
    }

    paymentId = existingPayment.id;
  } else {
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        provider: "lemon_squeezy",
        provider_order_id: providerOrderId,
        provider_customer_id: providerCustomerId,
        status: "paid",
        amount,
        currency,
        credits: pack.credits,
        credit_pack_id: pack.id,
        raw_payload: payload,
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      console.error("Failed to insert Lemon payment:", paymentError?.message);
      return NextResponse.json(
        { error: "Failed to record payment" },
        { status: 500 }
      );
    }

    paymentId = payment.id;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits_paid, credits_free")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("Profile not found for user:", userId, profileError?.message);
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

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({
      credits_paid: newPaid,
    })
    .eq("id", userId);

  if (updateProfileError) {
    console.error("Failed to update profile credits:", updateProfileError.message);
    return NextResponse.json(
      { error: "Failed to update balance" },
      { status: 500 }
    );
  }

  const { error: txError } = await supabase
    .from("credit_transactions")
    .insert({
      user_id: userId,
      tx_type: "purchase",
      source: "lemon_squeezy",
      delta_total: pack.credits,
      delta_paid: pack.credits,
      delta_free: 0,
      balance_total_after: newTotal,
      balance_paid_after: newPaid,
      balance_free_after: newFree,
      payment_id: paymentId,
      reason: `LemonSqueezy order ${providerOrderId}`,
    });

  if (txError) {
    console.error("Failed to insert credit transaction:", txError.message);
  }

  console.info("[LEMON WEBHOOK] credits applied", {
    userId,
    packId: pack.id,
    credits: pack.credits,
    providerOrderId,
    paymentId,
  });

  return NextResponse.json({ ok: true });
}
