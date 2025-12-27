// app/api/support/route.ts
import { SupportTicketCreateBody } from "@/app/types/support";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // (이메일/백엔드 호출 포함이면 nodejs 추천)

function json(status: number, body: Record<string, any>) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  const supabase = await createClient();

  // 1) 로그인 확인 (RLS + user_id 필요)
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) return json(401, { ok: false, error: userErr.message });
  if (!user) return json(401, { ok: false, error: "UNAUTHENTICATED" });

  // 2) 바디 파싱 (형식 검증은 DB 제약/타입에 맡김)
  let body: SupportTicketCreateBody;
  try {
    body = (await req.json()) as SupportTicketCreateBody;
  } catch {
    return json(400, { ok: false, error: "INVALID_JSON" });
  }

  const needs_reply = body.needs_reply ?? true;

  // 3) DB insert (DB 제약조건에서 걸러지면 여기서 error로 떨어짐)
  const { data: inserted, error: insertErr } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      category: body.category,
      title: body.title,
      message: body.message,
      email: body.email ?? null,
      needs_reply,
      meta: body.meta ?? null,
      status: "open",
    })
    .select("id")
    .single();

  if (insertErr) {
    // 제약조건 위반/권한/RLS 등은 여기로 옴
    return json(400, { ok: false, error: insertErr.message });
  }

  const ticket_id = inserted.id;

  // 4) brify-backend enqueue 호출 (ticket_id만)
  //    실패해도 티켓은 접수된 상태이므로 "접수 완료"는 반환하고,
  //    enqueue 실패 여부만 같이 내려줌(원하면 서버 로그만 남겨도 됨)
  let enqueue_ok = true;
  let enqueue_error: string | null = null;

  try {
    const backendUrl = process.env.BRIFY_BACKEND_URL;
    const backendToken = process.env.BRIFY_BACKEND_INTERNAL_TOKEN; // 선택(권장)

    if (!backendUrl) throw new Error("BRIFY_BACKEND_URL is not set");

    const acceptLang = req.headers.get("accept-language") ?? "";
    const locale = acceptLang.split(",")[0]?.trim() || undefined;

    const res = await fetch(`${backendUrl}/support/enqueue`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(backendToken ? { authorization: `Bearer ${backendToken}` } : {}),
      },
      body: JSON.stringify({ ticket_id, locale }),
      cache: "no-store",
    });

    if (!res.ok) {
      enqueue_ok = false;
      enqueue_error = `BACKEND_${res.status}`;
    }
  } catch (e: any) {
    enqueue_ok = false;
    enqueue_error = e?.message ?? "ENQUEUE_FAILED";
  }

  // 5) 응답
  return json(200, {
    ok: true,
    ticket_id,
    enqueue_ok,
    enqueue_error,
  });
}
