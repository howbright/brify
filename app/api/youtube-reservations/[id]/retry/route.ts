import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { adminSupabase } from "@/utils/supabase/admin";
import { notifyYoutubeReservationByEmail } from "../../_adminNotify";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = adminSupabase as any;
  const { data: current, error: currentError } = await db
    .from("youtube_reservations")
    .select("id,user_id,status,requester_email,url,output_language,credit_snapshot,created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (!["failed", "cancelled", "unsupported", "needs_credits"].includes(current.status)) {
    return NextResponse.json({ error: "RETRY_NOT_ALLOWED" }, { status: 400 });
  }

  const { data, error } = await db
    .from("youtube_reservations")
    .update({
      status: "retry_requested",
      status_reason: null,
      processed_at: null,
      admin_request_email_sent_at: null,
      admin_request_email_error: null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,status,updated_at")
    .single();

  if (error) {
    console.error("[youtube-reservations/retry] update failed", error);
    return NextResponse.json({ error: "RETRY_FAILED" }, { status: 500 });
  }

  const { data: admins } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("role", "ADMIN");

  const notifications = (admins ?? []).map((admin) => ({
    user_id: admin.id,
    category: "system" as const,
    status: "info" as const,
    event_type: "system_info" as const,
    title_key: "notifications.youtube_reservation_retry_admin.title",
    message_key: "notifications.youtube_reservation_retry_admin.message",
    source: "youtube_reservation",
    entity_id: id,
    dedupe_key: `youtube_reservation_retry_admin:${id}:${admin.id}:${Date.now()}`,
    params: { reservationId: id },
  }));

  if (notifications.length > 0) {
    const { error: notificationError } = await adminSupabase
      .from("notifications")
      .insert(notifications);
    if (notificationError) {
      console.error("[youtube-reservations/retry] notification failed", notificationError);
    }
  }

  const adminMailResult = await notifyYoutubeReservationByEmail({
    reservationId: String(current.id),
    requesterEmail: current.requester_email ?? null,
    url: String(current.url ?? ""),
    outputLanguage: String(current.output_language ?? "auto"),
    creditSnapshot: Number(current.credit_snapshot ?? 0),
    createdAt: current.created_at ?? null,
  });

  const { error: emailAuditError } = await db
    .from("youtube_reservations")
    .update({
      admin_request_email_sent_at: adminMailResult.ok ? adminMailResult.sentAt : null,
      admin_request_email_error: adminMailResult.ok ? null : adminMailResult.error,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (emailAuditError) {
    console.error("[youtube-reservations/retry] admin email audit update failed", emailAuditError);
  }

  return NextResponse.json({ reservation: data });
}
