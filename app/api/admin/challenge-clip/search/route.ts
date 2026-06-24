import type { NextRequest } from "next/server";
import { requireBlogAdmin } from "@/app/api/admin/blog/_auth";
import { searchAdmin } from "@/app/lib/challenge-clip/entitlements";
import { jsonError, jsonNoStore } from "@/app/lib/challenge-clip/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireBlogAdmin();
    if (!auth.ok) {
      return jsonNoStore({ error: "Unauthorized" }, auth.status);
    }

    const result = await searchAdmin({
      orderId: req.nextUrl.searchParams.get("orderId"),
      deviceUserId: req.nextUrl.searchParams.get("deviceUserId"),
    });
    return jsonNoStore(result.payload, result.status);
  } catch (error) {
    return jsonError(error);
  }
}
