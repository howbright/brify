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
        "id, title, short_title, description, summary, tags, channel_name, source_url, source_type, thumbnail_url, credits_charged, mind_elixir, mind_theme_override, map_status, created_at, updated_at"
      )
      .eq("share_token", token)
      .eq("share_enabled", true)
      .single();

    if (error || !data) return jsonError(404, "NOT_FOUND");

    const [{ data: notesData, error: notesError }, { data: termsData, error: termsError }] =
      await Promise.all([
        adminSupabase
          .from("map_notes")
          .select("id, text, created_at, updated_at")
          .eq("map_id", data.id)
          .order("created_at", { ascending: false }),
        adminSupabase
          .from("map_terms")
          .select("term, meaning, updated_at")
          .eq("map_id", data.id)
          .order("updated_at", { ascending: false }),
      ]);

    if (notesError) return jsonError(500, notesError.message);
    if (termsError) return jsonError(500, termsError.message);

    return NextResponse.json(
      {
        ok: true,
        map: {
          id: data.id,
          title: data.title,
          short_title: data.short_title,
          description: data.description,
          summary: data.summary,
          tags: data.tags,
          channel_name: data.channel_name,
          source_url: data.source_url,
          source_type: data.source_type,
          thumbnail_url: data.thumbnail_url,
          credits_charged: data.credits_charged,
          mind_elixir: data.mind_elixir,
          mind_theme_override: data.mind_theme_override,
          map_status: data.map_status,
          created_at: data.created_at,
          updated_at: data.updated_at,
          notes: Array.isArray(notesData) ? notesData : [],
          terms: Array.isArray(termsData) ? termsData : [],
        },
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return jsonError(500, message);
  }
}
