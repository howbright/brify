import { NextRequest } from "next/server";
import { handleLemonSqueezyWebhook } from "../../webhooks/lemonsqueezy/handler";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleLemonSqueezyWebhook(req);
}
