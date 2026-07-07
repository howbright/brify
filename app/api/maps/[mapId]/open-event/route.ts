import { NextResponse } from "next/server";
import { recordMapOpenEvent } from "@/app/lib/mapOpenEvents";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;
    if (!mapId) return jsonError(400, "mapId is required");

    const body = await request.json().catch(() => ({}));
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    const { data: map, error: mapError } = await supabase
      .from("maps")
      .select("id")
      .eq("id", mapId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (mapError) return jsonError(500, mapError.message);
    if (!map) return jsonError(404, "NOT_FOUND");

    const result = await recordMapOpenEvent({
      mapId,
      userId: user.id,
      accessMode: "owner",
      locale: typeof body?.locale === "string" ? body.locale : null,
      sessionKey: typeof body?.sessionKey === "string" ? body.sessionKey : null,
      userAgent: request.headers.get("user-agent"),
      referrer: request.headers.get("referer"),
    });

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    console.error("[maps/open-event] failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonError(500, "INTERNAL_ERROR");
  }
}
