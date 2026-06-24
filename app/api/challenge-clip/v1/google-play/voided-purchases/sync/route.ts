import type { NextRequest } from "next/server";
import {
  isAuthorized,
  syncVoidedPurchases,
} from "@/app/lib/challenge-clip/entitlements";
import { jsonError, jsonNoStore } from "@/app/lib/challenge-clip/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    return jsonNoStore(await syncVoidedPurchases());
  } catch (error) {
    return jsonError(error);
  }
}
