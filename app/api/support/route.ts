// app/api/support/route.ts
import { SupportTicketCreateBody } from "@/app/types/support";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function json(status: number, body: Record<string, any>) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  const supabase = await createClient();

  // ✅ (디버깅용) 요청에 쿠키가 들어오는지 확인
  // 배포에서 noisy하면 지워도 됨
  const cookieStore = await cookies();
  const cookieNames = cookieStore.getAll().map((c) => c.name);
  console.log("cookie names:", cookieNames);

  // 1) 로그인 확인 (RLS + user_id 필요)
  const { data, error: userErr } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  if (userErr) {
    console.log(userErr);
    return json(401, {
      ok: false,
      error: "AUTH_GET_USER_FAILED",
      message: userErr.message,
      // 디버깅 힌트(개발 중에만 남겨도 됨)
      has_cookie: cookieNames.length > 0,
    });
  }

  if (!user) {
    console.log("유저없음");
    return json(401, {
      ok: false,
      error: "UNAUTHENTICATED",
      has_cookie: cookieNames.length > 0,
    });
  }

  // 2) 바디 파싱
  let body: SupportTicketCreateBody;
  try {
    body = (await req.json()) as SupportTicketCreateBody;
  } catch {
    return json(400, { ok: false, error: "INVALID_JSON" });
  }

  const needs_reply = body.needs_reply ?? true;

  // ✅ (디버그) 지금 서버에서 user id 확인
  console.log("[/api/support] user.id:", user.id);
  console.log("[/api/support] category/title/message/email:", {
    category: body.category,
    titleLen: body.title?.length,
    messageLen: body.message?.length,
    email: body.email ?? null,
    needs_reply,
  });

    // ✅ 3) INSERT
    const insertPayload = {
        user_id: user.id,
        category: body.category,
        title: body.title,
        message: body.message,
        email: body.email ?? null,
        needs_reply,
        meta: body.meta ?? null,
        status: "open" as const,
      };
    console.log("insertPayload.user_id", insertPayload.user_id)

  // 3) DB insert
  const { data: inserted, error: insertErr } = await supabase
    .from("support_tickets")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertErr) {
    console.log(insertErr);
    return json(400, { ok: false, error: insertErr.message });
  }

  const ticket_id = inserted.id;

  // 4) brify-backend enqueue 호출
  let enqueue_ok = true;
  let enqueue_error: string | null = null;

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL; // 네가 바꿨다 했으니 여기 맞춰서 써도 됨
    const backendToken = process.env.BRIFY_BACKEND_INTERNAL_TOKEN;

    if (!backendUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");

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

  return json(200, { ok: true, ticket_id, enqueue_ok, enqueue_error });
}
