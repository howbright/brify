import { NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) return jsonError(400, "token is required");

    const { data, error } = await adminSupabase
      .from("maps")
      .select(
        "id, title, mind_elixir, mind_theme_override, map_status, updated_at"
      )
      .eq("share_token", token)
      .eq("share_enabled", true)
      .single();

    if (error || !data) return jsonError(404, "NOT_FOUND");

    return NextResponse.json(
      {
        ok: true,
        map: {
          id: data.id,
          title: data.title,
          mind_elixir: data.mind_elixir,
          mind_theme_override: data.mind_theme_override,
          map_status: data.map_status,
          updated_at: data.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
