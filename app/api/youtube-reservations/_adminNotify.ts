type NotifyYoutubeReservationArgs = {
  reservationId: string;
  requesterEmail: string | null;
  url: string;
  outputLanguage: string;
  creditSnapshot: number;
  createdAt: string | null;
};

export async function notifyYoutubeReservationByEmail(
  args: NotifyYoutubeReservationArgs
) {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const backendToken = process.env.BRIFY_BACKEND_INTERNAL_TOKEN;

  if (!backendUrl || !backendToken) {
    const error = "BACKEND_NOTIFY_ENV_MISSING";
    console.warn("[youtube-reservations] skip admin email: backend env is missing");
    return { ok: false, sentAt: null, error };
  }

  try {
    const response = await fetch(`${backendUrl}/support/notify-youtube-reservation`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${backendToken}`,
      },
      body: JSON.stringify({
        reservation_id: args.reservationId,
        requester_email: args.requesterEmail,
        url: args.url,
        output_language: args.outputLanguage,
        credit_snapshot: args.creditSnapshot,
        created_at: args.createdAt,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const error = `HTTP_${response.status}${detail ? `: ${detail}` : ""}`;
      console.error("[youtube-reservations] admin email failed", response.status, detail);
      return { ok: false, sentAt: null, error };
    }

    return { ok: true, sentAt: new Date().toISOString(), error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[youtube-reservations] admin email request failed", error);
    return { ok: false, sentAt: null, error: message };
  }
}
