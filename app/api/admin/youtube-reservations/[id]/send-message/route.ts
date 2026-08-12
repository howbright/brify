import { NextResponse } from "next/server";
import { requireBlogAdmin } from "@/app/api/admin/blog/_auth";
import { adminSupabase } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBlogAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const { id } = await params;
  const reservationId = cleanString(id);
  const body = await request.json().catch(() => ({}));
  const message = cleanString(body?.message);

  if (!reservationId) {
    return NextResponse.json({ error: "reservation_id_required" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "message_required" }, { status: 400 });
  }

  const db = adminSupabase as any;
  const { data: reservation, error: reservationError } = await db
    .from("youtube_reservations")
    .select("id,user_id,requester_email,url")
    .eq("id", reservationId)
    .single();

  if (reservationError || !reservation) {
    return NextResponse.json({ error: "reservation_not_found" }, { status: 404 });
  }

  let requesterEmail = cleanString(reservation.requester_email);
  let requesterLocale = "";
  if (!requesterEmail) {
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("email,locale")
      .eq("id", reservation.user_id)
      .single();
    requesterEmail = cleanString(profile?.email);
    requesterLocale = cleanString(profile?.locale);
  } else {
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("locale")
      .eq("id", reservation.user_id)
      .single();
    requesterLocale = cleanString(profile?.locale);
  }

  if (!requesterEmail) {
    return NextResponse.json({ error: "requester_email_missing" }, { status: 400 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  const backendToken = process.env.BRIFY_BACKEND_INTERNAL_TOKEN;

  if (!backendUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_BASE_URL is not set" },
      { status: 500 }
    );
  }
  if (!backendToken) {
    return NextResponse.json(
      { error: "BRIFY_BACKEND_INTERNAL_TOKEN is not set" },
      { status: 500 }
    );
  }

  const response = await fetch(`${backendUrl}/support/send-youtube-reservation-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${backendToken}`,
    },
    body: JSON.stringify({
      reservation_id: reservation.id,
      requester_email: requesterEmail,
      url: reservation.url,
      message,
      locale: requesterLocale,
    }),
    cache: "no-store",
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    await db
      .from("youtube_reservations")
      .update({
        manual_email_sent_at: null,
        manual_email_error: json?.error ?? json?.message ?? "MAIL_SEND_FAILED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation.id);
    return NextResponse.json(json, { status: response.status });
  }

  const { error: updateError } = await db
    .from("youtube_reservations")
    .update({
      status: "failed",
      status_reason: message,
      manual_email_sent_at: new Date().toISOString(),
      manual_email_error: null,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservation.id);

  if (updateError) {
    console.error("[admin/youtube-reservations/send-message] update failed", updateError);
  }

  return NextResponse.json({ ok: true });
}
