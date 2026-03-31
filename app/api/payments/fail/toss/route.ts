import { NextRequest, NextResponse } from "next/server";
import type { Json } from "@/app/types/database.types";
import { createClient } from "@/utils/supabase/server";
import { adminSupabase } from "@/utils/supabase/admin";

export const runtime = "nodejs";

type FailBody = {
  orderId?: string;
  code?: string;
  message?: string;
};

function isCanceled(code?: string, message?: string) {
  const normalizedMessage = (message ?? "").toLowerCase();
  return (
    code === "USER_CANCEL" ||
    code === "PAY_PROCESS_CANCELED" ||
    normalizedMessage.includes("cancel") ||
    normalizedMessage.includes("취소")
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: FailBody;
  try {
    body = (await req.json()) as FailBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  const code = body.code?.trim();
  const message = body.message?.trim();

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const { data: payment, error: paymentError } = await adminSupabase
    .from("payments")
    .select("id, user_id, status, raw_payload")
    .eq("provider", "toss")
    .eq("provider_order_id", orderId)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Payment order not found" }, { status: 404 });
  }

  if (payment.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (payment.status !== "pending") {
    return NextResponse.json({
      ok: true,
      status: payment.status,
      unchanged: true,
    });
  }

  const nextStatus = isCanceled(code, message) ? "canceled" : "failed";
  const prevRawPayload =
    payment.raw_payload && typeof payment.raw_payload === "object"
      ? (payment.raw_payload as Record<string, unknown>)
      : {};

  const nextRawPayload: Json = {
    ...prevRawPayload,
    fail_event: {
      source: "client",
      code: code ?? null,
      message: message ?? null,
      captured_at: new Date().toISOString(),
    },
  } as Json;

  const { error: updateError } = await adminSupabase
    .from("payments")
    .update({
      status: nextStatus,
      raw_payload: nextRawPayload,
    })
    .eq("id", payment.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: nextStatus,
  });
}
