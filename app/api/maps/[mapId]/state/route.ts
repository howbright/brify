import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/app/types/database.types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReadStatus = Database["public"]["Enums"]["map_read_status"];

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function normalizeReadStatus(value: unknown): ReadStatus | null {
  if (value === "unread" || value === "in_progress" || value === "read") return value;
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;
    if (!mapId) return jsonError(400, "mapId is required");

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    const { data, error } = await supabase
      .from("map_user_states")
      .select("read_status,starred,progress_percent,last_viewed_at,updated_at")
      .eq("user_id", user.id)
      .eq("map_id", mapId)
      .maybeSingle();

    if (error) return jsonError(500, error.message);

    return NextResponse.json({
      ok: true,
      state: data
        ? {
            readStatus: data.read_status,
            starred: data.starred,
            progressPercent: data.progress_percent,
            lastViewedAt: data.last_viewed_at,
            updatedAt: data.updated_at,
          }
        : null,
    });
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;
    if (!mapId) return jsonError(400, "mapId is required");

    const body = await req.json().catch(() => ({}));
    const readStatus = normalizeReadStatus(body?.readStatus);
    const starred =
      typeof body?.starred === "boolean" ? (body.starred as boolean) : undefined;
    const progressPercent =
      typeof body?.progressPercent === "number"
        ? Math.max(0, Math.min(100, Math.floor(body.progressPercent)))
        : undefined;
    const touchViewedAt = body?.touchViewedAt !== false;

    if (readStatus === null && starred === undefined && progressPercent === undefined && !touchViewedAt) {
      return jsonError(400, "No valid fields to update");
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    const updates: Database["public"]["Tables"]["map_user_states"]["Update"] = {};
    if (readStatus) updates.read_status = readStatus;
    if (typeof starred === "boolean") updates.starred = starred;
    if (typeof progressPercent === "number") updates.progress_percent = progressPercent;
    if (touchViewedAt) updates.last_viewed_at = new Date().toISOString();

    const { data: existing } = await supabase
      .from("map_user_states")
      .select("read_status,starred,progress_percent,last_viewed_at")
      .eq("user_id", user.id)
      .eq("map_id", mapId)
      .maybeSingle();

    const { data, error } = await supabase
      .from("map_user_states")
      .upsert(
        {
          user_id: user.id,
          map_id: mapId,
          read_status: updates.read_status ?? existing?.read_status ?? "unread",
          starred: updates.starred ?? existing?.starred ?? false,
          progress_percent: updates.progress_percent ?? existing?.progress_percent ?? 0,
          last_viewed_at:
            updates.last_viewed_at ??
            existing?.last_viewed_at ??
            new Date().toISOString(),
        },
        { onConflict: "user_id,map_id" }
      )
      .select("read_status,starred,progress_percent,last_viewed_at,updated_at")
      .single();

    if (error) return jsonError(500, error.message);

    return NextResponse.json({
      ok: true,
      state: {
        readStatus: data.read_status,
        starred: data.starred,
        progressPercent: data.progress_percent,
        lastViewedAt: data.last_viewed_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
