import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { jsonError } from "./_shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

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

    const { data: mapRow, error: mapError } = await supabase
      .from("maps")
      .select("id")
      .eq("id", mapId)
      .eq("user_id", user.id)
      .single();

    if (mapError || !mapRow) {
      return jsonError(404, "MAP_NOT_FOUND");
    }

    const { data: terms, error: termsError } = await supabase
      .from("map_terms")
      .select("id, term, meaning, lang, created_at, updated_at, request_id")
      .eq("map_id", mapId)
      .order("updated_at", { ascending: false });

    if (termsError) {
      return jsonError(500, termsError.message);
    }

    return NextResponse.json(
      {
        ok: true,
        terms: Array.isArray(terms) ? terms : [],
      },
      { status: 200 }
    );
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
