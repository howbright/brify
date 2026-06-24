import { requireBlogAdmin } from "@/app/api/admin/blog/_auth";
import { syncVoidedPurchases } from "@/app/lib/challenge-clip/entitlements";
import { jsonError, jsonNoStore } from "@/app/lib/challenge-clip/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const auth = await requireBlogAdmin();
    if (!auth.ok) {
      return jsonNoStore({ error: "Unauthorized" }, auth.status);
    }

    return jsonNoStore(await syncVoidedPurchases());
  } catch (error) {
    return jsonError(error);
  }
}
