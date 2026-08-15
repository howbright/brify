import { NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";
import { requireBlogAdmin } from "@/app/api/admin/blog/_auth";
import {
  YOUTUBE_RESERVATION_STATUSES,
  type YoutubeReservationStatus,
} from "@/app/lib/youtubeReservations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_SET = new Set<YoutubeReservationStatus>(YOUTUBE_RESERVATION_STATUSES);

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableInt(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function GET() {
  const auth = await requireBlogAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const db = adminSupabase as any;
  const { data: reservations, error } = await db
    .from("youtube_reservations")
    .select(
      "id,user_id,requester_email,url,video_id,output_language,status,status_reason,required_credits,charged_credits,credit_snapshot,result_map_id,admin_notes,processed_at,admin_request_email_sent_at,admin_request_email_error,user_email_sent_at,user_email_error,admin_failure_email_sent_at,admin_failure_email_error,manual_email_sent_at,manual_email_error,refunded_credits,refunded_at,refund_error,created_at,updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[admin/youtube-reservations] list failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  const userIds = Array.from(
    new Set<string>(
      (reservations ?? [])
        .map((row: any) => (typeof row.user_id === "string" ? row.user_id : ""))
        .filter(Boolean)
    )
  );

  const { data: profiles, error: profileError } = userIds.length
    ? await adminSupabase
        .from("profiles")
        .select("id,email,credits_free,credits_paid,role")
        .in("id", userIds)
    : { data: [], error: null };

  if (profileError) {
    console.error("[admin/youtube-reservations] profiles load failed", profileError);
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        email: profile.email,
        creditsFree: Number(profile.credits_free ?? 0),
        creditsPaid: Number(profile.credits_paid ?? 0),
        creditsTotal:
          Number(profile.credits_free ?? 0) + Number(profile.credits_paid ?? 0),
        role: profile.role,
      },
    ])
  );

  const mapIds = Array.from(
    new Set<string>(
      (reservations ?? [])
        .map((row: any) =>
          typeof row.result_map_id === "string" ? row.result_map_id : ""
        )
        .filter(Boolean)
    )
  );

  const { data: expansionRows, error: expansionError } = mapIds.length
    ? await adminSupabase
        .from("map_node_expansions")
        .select("map_id,status")
        .in("map_id", mapIds)
    : { data: [], error: null };

  if (expansionError) {
    console.error("[admin/youtube-reservations] expansion stats load failed", expansionError);
  }

  const expansionStatsByMapId = new Map<
    string,
    { total: number; queued: number; processing: number; done: number; failed: number }
  >();
  for (const row of expansionRows ?? []) {
    const mapId = typeof row.map_id === "string" ? row.map_id : "";
    if (!mapId) continue;
    const current =
      expansionStatsByMapId.get(mapId) ??
      { total: 0, queued: 0, processing: 0, done: 0, failed: 0 };
    current.total += 1;
    if (row.status === "queued") current.queued += 1;
    else if (row.status === "processing") current.processing += 1;
    else if (row.status === "done") current.done += 1;
    else if (row.status === "failed") current.failed += 1;
    expansionStatsByMapId.set(mapId, current);
  }

  return NextResponse.json({
    reservations: (reservations ?? []).map((row: any) => {
      const profile = profilesById.get(row.user_id);
      return {
        ...row,
        requester_email: row.requester_email ?? profile?.email ?? null,
        requester: profile ?? null,
        expansion_stats:
          typeof row.result_map_id === "string"
            ? expansionStatsByMapId.get(row.result_map_id) ?? {
                total: 0,
                queued: 0,
                processing: 0,
                done: 0,
                failed: 0,
              }
            : { total: 0, queued: 0, processing: 0, done: 0, failed: 0 },
      };
    }),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireBlogAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const id = cleanString(body?.id);
  const status = cleanString(body?.status) as YoutubeReservationStatus;

  if (!id) {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }
  if (!STATUS_SET.has(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const processedAt =
    status === "done" || status === "failed" || status === "cancelled"
      ? new Date().toISOString()
      : null;

  const db = adminSupabase as any;
  const { data, error } = await db
    .from("youtube_reservations")
    .update({
      status,
      status_reason: cleanString(body?.statusReason) || null,
      required_credits: toNullableInt(body?.requiredCredits),
      charged_credits: toNullableInt(body?.chargedCredits),
      result_map_id: cleanString(body?.resultMapId) || null,
      admin_notes: cleanString(body?.adminNotes) || null,
      processed_at: processedAt,
    })
    .eq("id", id)
    .select(
      "id,user_id,requester_email,url,video_id,output_language,status,status_reason,required_credits,charged_credits,credit_snapshot,result_map_id,admin_notes,processed_at,admin_request_email_sent_at,admin_request_email_error,user_email_sent_at,user_email_error,admin_failure_email_sent_at,admin_failure_email_error,manual_email_sent_at,manual_email_error,refunded_credits,refunded_at,refund_error,created_at,updated_at"
    )
    .single();

  if (error) {
    console.error("[admin/youtube-reservations] update failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  return NextResponse.json({ reservation: data });
}
