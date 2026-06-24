import type { NextRequest } from "next/server";
import { syncVoidedPurchases } from "@/app/lib/challenge-clip/entitlements";
import { jsonError, jsonNoStore } from "@/app/lib/challenge-clip/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET =
  process.env.CHALLENGECLIP_CRON_SECRET || process.env.CRON_SECRET || "";

function isCronAuthorized(req: NextRequest) {
  if (CRON_SECRET) {
    return req.headers.get("authorization") === `Bearer ${CRON_SECRET}`;
  }

  return (req.headers.get("user-agent") || "").includes("vercel-cron/1.0");
}

export async function GET(req: NextRequest) {
  try {
    if (!isCronAuthorized(req)) {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const result = await syncVoidedPurchases();
    return jsonNoStore({
      ok: true,
      source: "vercel-cron",
      ...result,
    });
  } catch (error) {
    return jsonError(error);
  }
}
