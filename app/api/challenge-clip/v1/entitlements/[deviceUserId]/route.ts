import type { NextRequest } from "next/server";
import { getEntitlement } from "@/app/lib/challenge-clip/entitlements";
import { jsonError, jsonNoStore } from "@/app/lib/challenge-clip/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ deviceUserId: string }> }
) {
  try {
    const { deviceUserId } = await params;
    return jsonNoStore(await getEntitlement(decodeURIComponent(deviceUserId)));
  } catch (error) {
    return jsonError(error);
  }
}
