import { NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getConfiguredPin() {
  return process.env.BRIFY_ADMIN_ALARM_PIN?.trim() ?? "";
}

function isAuthorized(request: Request) {
  const configuredPin = getConfiguredPin();
  if (!configuredPin) return false;
  const providedPin = request.headers.get("x-admin-alarm-pin")?.trim() ?? "";
  return providedPin.length > 0 && providedPin === configuredPin;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getConfiguredPin()) {
    return jsonError("ADMIN_ALARM_PIN_NOT_CONFIGURED", 503);
  }
  if (!isAuthorized(request)) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const { id } = await params;
  const reservationId = cleanString(id);
  if (!reservationId) {
    return jsonError("RESERVATION_ID_REQUIRED", 400);
  }

  const body = await request.json().catch(() => ({}));
  const acknowledgedBy =
    cleanString(body?.acknowledged_by).slice(0, 80) || "brify-admin-alarm";

  const db = adminSupabase as any;
  const { data, error } = await db
    .from("youtube_reservations")
    .update({
      admin_alert_acknowledged_at: new Date().toISOString(),
      admin_alert_acknowledged_by: acknowledgedBy,
    })
    .eq("id", reservationId)
    .select("id,admin_alert_acknowledged_at,admin_alert_acknowledged_by")
    .single();

  if (error || !data) {
    console.error("[admin-alarm/youtube-reservations/ack] update failed", error);
    return jsonError("ADMIN_ALARM_ACK_FAILED", 500);
  }

  return NextResponse.json({ ok: true, reservation: data });
}
