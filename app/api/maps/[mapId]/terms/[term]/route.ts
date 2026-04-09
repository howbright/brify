import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ mapId: string; term: string }> }
) {
  try {
    const { mapId, term } = await params;
    if (!mapId) return jsonError(400, "mapId is required");
    if (!term) return jsonError(400, "term is required");

    const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backendBase) return jsonError(500, "NEXT_PUBLIC_API_BASE_URL is not set");

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return jsonError(401, "UNAUTHORIZED");
    }

    const res = await fetch(
      `${backendBase}/maps/${mapId}/terms/${encodeURIComponent(term)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
