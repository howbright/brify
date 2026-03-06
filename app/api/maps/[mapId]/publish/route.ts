import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(
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

    const { data: mapRow, error: fetchError } = await supabase
      .from("maps")
      .select("mind_elixir_draft")
      .eq("id", mapId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) return jsonError(500, fetchError.message);

    const draft = mapRow?.mind_elixir_draft ?? null;
    if (!draft) return jsonError(400, "NO_DRAFT");

    const { data, error } = await supabase
      .from("maps")
      .update({ mind_elixir: draft, mind_elixir_draft: null })
      .eq("id", mapId)
      .eq("user_id", user.id)
      .select("mind_elixir, mind_elixir_draft")
      .single();

    if (error) return jsonError(500, error.message);

    return NextResponse.json(
      { ok: true, mind_elixir: data?.mind_elixir ?? null },
      { status: 200 }
    );
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
