import type { NextRequest } from "next/server";
import { recordProUsageEvent } from "@/app/lib/challenge-clip/entitlements";
import { jsonNoStore } from "@/app/lib/challenge-clip/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRO_USAGE_BODY_LIMIT_BYTES = 8 * 1024;

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > PRO_USAGE_BODY_LIMIT_BYTES) {
      return jsonNoStore({ error: "Request body too large" }, 413);
    }

    const result = await recordProUsageEvent(await req.json());
    return jsonNoStore(result.payload, result.status);
  } catch (error) {
    console.error(error);
    return jsonNoStore({ error: "Pro usage event recording failed" }, 500);
  }
}
