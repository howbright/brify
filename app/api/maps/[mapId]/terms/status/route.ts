import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { jsonError } from "../_shared";

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

    const { data: latestRequest, error: requestError } = await supabase
      .from("map_term_requests")
      .select("id, status, error, mode, terms_csv, job_id, created_at, updated_at")
      .eq("map_id", mapId)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (requestError) {
      return jsonError(500, requestError.message);
    }

    if (!latestRequest) {
      return NextResponse.json(
        {
          ok: true,
          status: "idle",
          hasRequest: false,
          requestId: null,
          error: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: latestRequest.status,
        hasRequest: true,
        requestId: latestRequest.id,
        id: latestRequest.id,
        error: latestRequest.error,
        mode: latestRequest.mode,
        termsCsv: latestRequest.terms_csv,
        jobId: latestRequest.job_id,
        createdAt: latestRequest.created_at,
        updatedAt: latestRequest.updated_at,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
