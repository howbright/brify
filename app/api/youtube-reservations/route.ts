import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { adminSupabase } from "@/utils/supabase/admin";
import { parseYoutubeUrl } from "@/app/lib/youtubeReservations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(extra ?? {}) }, { status });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const db = adminSupabase as any;
  const { data, error } = await db
    .from("youtube_reservations")
    .select(
      "id,url,video_id,output_language,status,status_reason,required_credits,charged_credits,result_map_id,processed_at,created_at,updated_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[youtube-reservations] list failed", error);
    return jsonError("YOUTUBE_RESERVATION_LIST_FAILED", 500);
  }

  return NextResponse.json({ reservations: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const body = await request.json().catch(() => ({}));
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
  const outputLanguage =
    typeof body?.output_language === "string"
      ? body.output_language.trim().slice(0, 32) || "auto"
      : "auto";
  const urlInfo = parseYoutubeUrl(rawUrl);

  if (!rawUrl || !urlInfo.isYoutube) {
    return jsonError("INVALID_YOUTUBE_URL", 400);
  }

  if (urlInfo.isShorts) {
    return jsonError("YOUTUBE_SHORTS_UNSUPPORTED", 400);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, credits_free, credits_paid")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("[youtube-reservations] profile load failed", profileError);
    return jsonError("PROFILE_LOAD_FAILED", 500);
  }

  const creditsFree = Number(profile.credits_free ?? 0);
  const creditsPaid = Number(profile.credits_paid ?? 0);
  const creditTotal = creditsFree + creditsPaid;

  const db = adminSupabase as any;
  const { data: reservation, error: reservationError } = await db
    .from("youtube_reservations")
    .insert({
      user_id: user.id,
      requester_email: profile.email ?? user.email ?? null,
      url: urlInfo.normalizedUrl,
      video_id: urlInfo.videoId,
      output_language: outputLanguage,
      status: "requested",
      credit_snapshot: creditTotal,
    })
    .select("id,status,url,created_at")
    .single();

  if (reservationError || !reservation) {
    console.error("[youtube-reservations] insert failed", reservationError);
    return jsonError("YOUTUBE_RESERVATION_CREATE_FAILED", 500);
  }

  const { data: admins } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("role", "ADMIN");

  const adminNotifications = (admins ?? []).map((admin) => ({
    user_id: admin.id,
    category: "system" as const,
    status: "info" as const,
    event_type: "system_info" as const,
    title_key: "notifications.youtube_reservation_admin.title",
    message_key: "notifications.youtube_reservation_admin.message",
    source: "youtube_reservation",
    entity_id: reservation.id,
    dedupe_key: `youtube_reservation_admin:${reservation.id}:${admin.id}`,
    params: {
      email: profile.email ?? user.email ?? "unknown",
      url: urlInfo.normalizedUrl,
      outputLanguage,
    },
  }));

  if (adminNotifications.length > 0) {
    const { error: notificationError } = await adminSupabase
      .from("notifications")
      .insert(adminNotifications);
    if (notificationError) {
      console.error("[youtube-reservations] admin notification failed", notificationError);
    }
  }

  return NextResponse.json({
    ok: true,
    reservation,
    currentCredits: creditTotal,
  });
}
