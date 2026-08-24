import { NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACTIVE_ALARM_STATUSES = ["requested", "retry_requested"] as const;

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

function parseLimit(request: Request) {
  const url = new URL(request.url);
  const raw = Number(url.searchParams.get("limit") ?? 20);
  if (!Number.isFinite(raw)) return 20;
  return Math.max(1, Math.min(50, Math.floor(raw)));
}

export async function GET(request: Request) {
  if (!getConfiguredPin()) {
    return jsonError("ADMIN_ALARM_PIN_NOT_CONFIGURED", 503);
  }
  if (!isAuthorized(request)) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const db = adminSupabase as any;
  const { data, error } = await db
    .from("youtube_reservations")
    .select(
      "id,requester_email,url,video_id,output_language,status,status_reason,credit_snapshot,created_at,updated_at"
    )
    .in("status", [...ACTIVE_ALARM_STATUSES])
    .is("admin_alert_acknowledged_at", null)
    .order("created_at", { ascending: true })
    .limit(parseLimit(request));

  if (error) {
    console.error("[admin-alarm/youtube-reservations] list failed", error);
    return jsonError("ADMIN_ALARM_LIST_FAILED", 500);
  }

  return NextResponse.json({
    ok: true,
    alerts: (data ?? []).map((row: any) => ({
      id: row.id,
      type: "youtube_reservation",
      email: row.requester_email ?? null,
      url: row.url,
      videoId: row.video_id ?? null,
      outputLanguage: row.output_language ?? "auto",
      status: row.status,
      statusReason: row.status_reason ?? null,
      creditSnapshot: row.credit_snapshot ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      adminUrl: "/ko/admin/youtube-reservations",
    })),
    polledAt: new Date().toISOString(),
  });
}
