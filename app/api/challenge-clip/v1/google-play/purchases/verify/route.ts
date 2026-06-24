import type { NextRequest } from "next/server";
import { verifyProductPurchase } from "@/app/lib/challenge-clip/entitlements";
import { jsonNoStore } from "@/app/lib/challenge-clip/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFY_BODY_LIMIT_BYTES = 16 * 1024;
const VERIFY_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const VERIFY_RATE_LIMIT_MAX = 12;
const verifyRateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for") || "";
  return (
    forwardedFor.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimitVerifyRequest(req: NextRequest, deviceUserId = "unknown") {
  const now = Date.now();
  const key = `${clientIp(req)}:${deviceUserId}`;
  const current = verifyRateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    verifyRateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + VERIFY_RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  current.count += 1;
  if (current.count > VERIFY_RATE_LIMIT_MAX) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > VERIFY_BODY_LIMIT_BYTES) {
      return jsonNoStore({ error: "Request body too large" }, 413);
    }

    const body = await req.json();
    const retryAfter = rateLimitVerifyRequest(
      req,
      typeof body?.deviceUserId === "string" ? body.deviceUserId : "unknown"
    );
    if (retryAfter) {
      return jsonNoStore(
        { error: "Too many purchase verification attempts" },
        429,
        { "retry-after": String(retryAfter) }
      );
    }

    const result = await verifyProductPurchase(body);
    return jsonNoStore(result.payload, result.status);
  } catch (error) {
    console.error(error);
    return jsonNoStore({ error: "Purchase verification failed" }, 500);
  }
}
