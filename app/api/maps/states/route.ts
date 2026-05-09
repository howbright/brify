import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/app/types/database.types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

type ReadStatus = Database["public"]["Enums"]["map_read_status"];

function parseIds(req: NextRequest, body?: { mapIds?: unknown }) {
  const idsFromBody = Array.isArray(body?.mapIds) ? body.mapIds : null;
  if (idsFromBody) {
    return idsFromBody
      .map((v: unknown) => String(v).trim())
      .filter(Boolean);
  }

  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) return [];
  return idsParam
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { mapIds?: unknown };
    const mapIds = parseIds(req, body);
    if (!mapIds.length) return NextResponse.json({ ok: true, states: {} });

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    const { data, error } = await supabase
      .from("map_user_states")
      .select("map_id,read_status,starred,progress_percent,last_viewed_at,updated_at")
      .eq("user_id", user.id)
      .in("map_id", mapIds);

    if (error) return jsonError(500, error.message);

    const states: Record<
      string,
      {
        readStatus: ReadStatus;
        starred: boolean;
        progressPercent: number;
        lastViewedAt: string | null;
        updatedAt: string;
      }
    > = {};

    for (const row of data ?? []) {
      states[row.map_id] = {
        readStatus: row.read_status,
        starred: row.starred,
        progressPercent: row.progress_percent,
        lastViewedAt: row.last_viewed_at,
        updatedAt: row.updated_at,
      };
    }

    return NextResponse.json({ ok: true, states });
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
