import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  return { supabase, user, authError };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;
    if (!mapId) return jsonError(400, "mapId is required");

    const { supabase, user, authError } = await getAuthedUser();
    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    const { data, error } = await supabase
      .from("maps")
      .select("id, share_enabled, share_token")
      .eq("id", mapId)
      .eq("user_id", user.id)
      .single();

    if (error) return jsonError(500, error.message);

    return NextResponse.json(
      {
        ok: true,
        share_enabled: data?.share_enabled ?? false,
        share_token: data?.share_token ?? null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;
    if (!mapId) return jsonError(400, "mapId is required");

    const { supabase, user, authError } = await getAuthedUser();
    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    const { data: current, error: fetchError } = await supabase
      .from("maps")
      .select("share_token")
      .eq("id", mapId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) return jsonError(500, fetchError.message);

    const token = current?.share_token ?? randomUUID();

    const { data, error } = await supabase
      .from("maps")
      .update({ share_enabled: true, share_token: token })
      .eq("id", mapId)
      .eq("user_id", user.id)
      .select("share_enabled, share_token")
      .single();

    if (error) return jsonError(500, error.message);

    return NextResponse.json(
      {
        ok: true,
        share_enabled: data?.share_enabled ?? true,
        share_token: data?.share_token ?? token,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;
    if (!mapId) return jsonError(400, "mapId is required");

    const { supabase, user, authError } = await getAuthedUser();
    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    const { data, error } = await supabase
      .from("maps")
      .update({ share_enabled: false, share_token: null })
      .eq("id", mapId)
      .eq("user_id", user.id)
      .select("share_enabled, share_token")
      .single();

    if (error) return jsonError(500, error.message);

    return NextResponse.json(
      {
        ok: true,
        share_enabled: data?.share_enabled ?? false,
        share_token: data?.share_token ?? null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
