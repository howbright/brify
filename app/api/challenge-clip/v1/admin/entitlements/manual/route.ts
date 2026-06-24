import type { NextRequest } from "next/server";
import {
  isAuthorized,
  setManualEntitlement,
} from "@/app/lib/challenge-clip/entitlements";
import { jsonError, jsonNoStore } from "@/app/lib/challenge-clip/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const result = await setManualEntitlement(await req.json());
    return jsonNoStore(result.payload, result.status);
  } catch (error) {
    return jsonError(error);
  }
}
