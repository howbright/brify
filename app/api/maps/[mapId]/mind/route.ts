import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;
    if (!mapId) return jsonError(400, "mapId is required");

    const body = await req.json().catch(() => ({}));
    const mind = body?.mind_elixir;
    if (mind === undefined) {
      return jsonError(400, "mind_elixir is required");
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    const { data, error } = await supabase
      .from("maps")
      .update({ mind_elixir: mind })
      .eq("id", mapId)
      .eq("user_id", user.id)
      .select("mind_elixir")
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
