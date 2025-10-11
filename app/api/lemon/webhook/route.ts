// app/api/lemon/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

function verifySignature(rawBody: string, signature: string, secret: string) {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  // 타이밍 공격 방지 비교
  const a = Buffer.from(digest);
  const b = Buffer.from(signature || "", "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_SIGNING_SECRET;
  if (!secret) {
    // 서버 설정 누락 방지
    return NextResponse.json({ ok: false, error: "Missing signing secret" }, { status: 500 });
  }

  // ⚠️ 반드시 raw body 사용
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") || "";

  // 1) 서명 검증
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  // 2) 파싱 + 가벼운 로깅
  const payload = JSON.parse(rawBody);
  const event = payload?.meta?.event_name as string | undefined;
  const orderId = payload?.data?.id as string | undefined;

  console.log("[LEMON WEBHOOK]", { event, orderId, test: payload?.meta?.test_mode });

  // 3) 빠른 200 응답
  return NextResponse.json({ ok: true });
}
