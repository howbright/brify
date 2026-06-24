import type { NextRequest } from "next/server";
import {
  isAuthorized,
  searchAdmin,
} from "@/app/lib/challenge-clip/entitlements";
import { jsonError, jsonNoStore } from "@/app/lib/challenge-clip/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const result = await searchAdmin({
      deviceUserId: req.nextUrl.searchParams.get("deviceUserId"),
      orderId: req.nextUrl.searchParams.get("orderId"),
    });

    return jsonNoStore(result.payload, result.status);
  } catch (error) {
    return jsonError(error);
  }
}
