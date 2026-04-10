import { NextRequest } from "next/server";
import { jsonError, proxyTermsRequest } from "../_shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ mapId: string; term: string }> }
) {
  try {
    const { mapId, term } = await params;
    if (!mapId) return jsonError(400, "mapId is required");
    if (!term) return jsonError(400, "term is required");

    return proxyTermsRequest(
      `/maps/${mapId}/terms/${encodeURIComponent(term)}`,
      {
        method: "DELETE",
      }
    );
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
