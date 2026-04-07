import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const event =
    typeof body?.event === "string" && body.event.length <= 120
      ? body.event
      : "unknown";
  const sessionId =
    typeof body?.sessionId === "string" && body.sessionId.length <= 200
      ? body.sessionId
      : "unknown";
  const href = typeof body?.href === "string" ? body.href.slice(0, 500) : "";
  const at = typeof body?.at === "string" ? body.at : new Date().toISOString();
  const payload = body?.payload && typeof body.payload === "object" ? body.payload : {};

  console.log(
    `[ME_DEBUG] ${JSON.stringify({
      at,
      event,
      sessionId,
      href,
      payload,
    })}`
  );

  return NextResponse.json({ ok: true });
}
