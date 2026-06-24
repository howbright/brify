import { jsonNoStore } from "@/app/lib/challenge-clip/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return jsonNoStore({ ok: true });
}
