import { NextRequest } from "next/server";
import { jsonError, proxyTermsRequest } from "../_shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;
    if (!mapId) return jsonError(400, "mapId is required");

    const body = await req.json().catch(() => ({}));

    return proxyTermsRequest(`/maps/${mapId}/terms/custom`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
      contentType: "application/json",
    });
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
