import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function normalizeThemeOverride(input: unknown) {
  if (input === null) return null;
  if (input === undefined) return undefined;
  const raw = String(input).trim();
  if (!raw) return null;
  if (raw.length > 64) return "__TOO_LONG__";
  return raw;
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
      .from("maps")
      .select("mind_theme_override")
      .eq("id", mapId)
      .eq("user_id", user.id)
      .single();

    if (error) return jsonError(500, error.message);

    return NextResponse.json(
      { ok: true, mind_theme_override: data?.mind_theme_override ?? null },
      { status: 200 }
    );
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
    const normalized = normalizeThemeOverride(
      body?.mind_theme_override ?? body?.theme
    );

    if (normalized === undefined) {
      return jsonError(400, "mind_theme_override is required");
    }
    if (normalized === "__TOO_LONG__") {
      return jsonError(400, "mind_theme_override is too long");
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    const { data, error } = await supabase
      .from("maps")
      .update({ mind_theme_override: normalized })
      .eq("id", mapId)
      .eq("user_id", user.id)
      .select("mind_theme_override")
      .single();

    if (error) return jsonError(500, error.message);

    return NextResponse.json(
      { ok: true, mind_theme_override: data?.mind_theme_override ?? null },
      { status: 200 }
    );
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
