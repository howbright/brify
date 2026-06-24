import type { NextRequest } from "next/server";
import { requireBlogAdmin } from "@/app/api/admin/blog/_auth";
import { setManualEntitlement } from "@/app/lib/challenge-clip/entitlements";
import { jsonError, jsonNoStore } from "@/app/lib/challenge-clip/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireBlogAdmin();
    if (!auth.ok) {
      return jsonNoStore({ error: "Unauthorized" }, auth.status);
    }

    const result = await setManualEntitlement(await req.json());
    return jsonNoStore(result.payload, result.status);
  } catch (error) {
    return jsonError(error);
  }
}
