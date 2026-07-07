import { NextResponse } from "next/server";
import { recordMapOpenEvent } from "@/app/lib/mapOpenEvents";
import { adminSupabase } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) return jsonError(400, "token is required");

    const body = await request.json().catch(() => ({}));
    const { data: map, error: mapError } = await adminSupabase
      .from("maps")
      .select("id")
      .eq("share_token", token)
      .eq("share_enabled", true)
      .maybeSingle();

    if (mapError) return jsonError(500, mapError.message);
    if (!map) return jsonError(404, "NOT_FOUND");

    const result = await recordMapOpenEvent({
      mapId: map.id,
      userId: null,
      accessMode: "shared",
      locale: typeof body?.locale === "string" ? body.locale : null,
      sessionKey: typeof body?.sessionKey === "string" ? body.sessionKey : null,
      userAgent: request.headers.get("user-agent"),
      referrer: request.headers.get("referer"),
    });

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    console.error("[share/open-event] failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonError(500, "INTERNAL_ERROR");
  }
}
