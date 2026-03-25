import { NextRequest, NextResponse } from "next/server";
import type { Json } from "@/app/types/database.types";
import { createClient } from "@/utils/supabase/server";
import { adminSupabase } from "@/utils/supabase/admin";

export const runtime = "nodejs";

type ConfirmBody = {
  paymentKey?: string;
  orderId?: string;
  amount?: number | string;
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "TOSS_SECRET_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: ConfirmBody;
  try {
    body = (await req.json()) as ConfirmBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const paymentKey = body.paymentKey?.trim();
  const orderId = body.orderId?.trim();
  const amount =
    typeof body.amount === "string" ? Number(body.amount) : body.amount;

  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return NextResponse.json(
      { error: "paymentKey, orderId, amount are required" },
      { status: 400 }
    );
  }

  const { data: payment, error: paymentError } = await adminSupabase
    .from("payments")
    .select("id, user_id, provider, provider_order_id, amount, credits, currency, status, credit_pack_id")
    .eq("provider", "toss")
    .eq("provider_order_id", orderId)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Payment order not found" }, { status: 404 });
  }

  if (payment.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (payment.status === "paid") {
    return NextResponse.json({
      ok: true,
      alreadyConfirmed: true,
      paymentId: payment.id,
    });
  }

  if (payment.status !== "pending") {
    return NextResponse.json(
      { error: `Payment is not pending: ${payment.status}` },
      { status: 400 }
    );
  }

  if (payment.amount !== amount) {
    return NextResponse.json(
      { error: "Amount does not match payment order" },
      { status: 400 }
    );
  }

  const authorization = Buffer.from(`${secretKey}:`).toString("base64");

  const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/json",
      "Idempotency-Key": orderId,
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  const tossPayload = (await tossRes.json()) as Record<string, unknown>;

  if (!tossRes.ok) {
    await adminSupabase
      .from("payments")
      .update({
        status: "failed",
        raw_payload: tossPayload as Json,
      })
      .eq("id", payment.id);

    return NextResponse.json(
      {
        error: typeof tossPayload.message === "string"
          ? tossPayload.message
          : "Failed to confirm payment",
        code: tossPayload.code,
      },
      { status: tossRes.status }
    );
  }

  const approvedAt =
    typeof tossPayload.approvedAt === "string"
      ? tossPayload.approvedAt
      : new Date().toISOString();

  const receipt =
    tossPayload.receipt &&
    typeof tossPayload.receipt === "object" &&
    "url" in tossPayload.receipt
      ? tossPayload.receipt
      : null;

  const receiptUrl =
    receipt && typeof receipt.url === "string"
      ? receipt.url
      : null;

  const providerCustomerId =
    typeof tossPayload.customerKey === "string"
      ? tossPayload.customerKey
      : null;

  const { error: paymentUpdateError } = await adminSupabase
    .from("payments")
    .update({
      status: "paid",
      paid_at: approvedAt,
      receipt_url: receiptUrl,
      provider_customer_id: providerCustomerId,
      raw_payload: tossPayload as Json,
    })
    .eq("id", payment.id);

  if (paymentUpdateError) {
    console.error("Failed to update payment after Toss confirm:", paymentUpdateError.message);
    return NextResponse.json(
      { error: "Failed to update payment record" },
      { status: 500 }
    );
  }

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("credits_paid, credits_free")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 500 }
    );
  }

  const currentPaid = profile.credits_paid ?? 0;
  const currentFree = profile.credits_free ?? 0;
  const newPaid = currentPaid + payment.credits;
  const newFree = currentFree;
  const newTotal = newPaid + newFree;

  const { error: profileUpdateError } = await adminSupabase
    .from("profiles")
    .update({
      credits_paid: newPaid,
    })
    .eq("id", user.id);

  if (profileUpdateError) {
    return NextResponse.json(
      { error: "Failed to update credit balance" },
      { status: 500 }
    );
  }

  const { error: txError } = await adminSupabase
    .from("credit_transactions")
    .insert({
      user_id: user.id,
      tx_type: "purchase",
      source: "toss",
      delta_total: payment.credits,
      delta_paid: payment.credits,
      delta_free: 0,
      balance_total_after: newTotal,
      balance_paid_after: newPaid,
      balance_free_after: newFree,
      payment_id: payment.id,
      reason: `Toss payment ${orderId}`,
    });

  if (txError) {
    console.error("Failed to insert credit transaction:", txError.message);
    return NextResponse.json(
      { error: "Failed to record credit transaction" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    paymentId: payment.id,
    receiptUrl,
    chargedCredits: payment.credits,
  });
}
