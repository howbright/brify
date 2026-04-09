import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;
    if (!mapId) return jsonError(400, "mapId is required");

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

    const res = await fetch(`${backendBase}/maps/${mapId}/terms`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: json?.error ?? json?.message ?? "TERMS_FETCH_FAILED" },
        { status: res.status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        terms: Array.isArray(json?.terms)
          ? json.terms
          : Array.isArray(json?.items)
            ? json.items
            : [],
      },
      { status: 200 }
    );
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
