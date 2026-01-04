// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { NotificationItem } from "@/app/types/notice";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toInt(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * GET /api/notifications?limit=5
 * - 로그인된 유저의 notifications를 최신순으로 가져옵니다.
 * - Supabase RLS가 (user_id = auth.uid()) select만 허용한다고 가정합니다.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Math.max(toInt(url.searchParams.get("limit"), 5), 1), 30);

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // 로그인 안 되어있으면 빈 배열 반환(프론트에서 조용히 무시)
    if (sessionError || !session?.user) {
      return NextResponse.json({ ok: true, items: [] }, { status: 200 });
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, created_at, category, status, delta_credits, title_key, message_key, params"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, items: [] },
        { status: 500 }
      );
    }

    // DB row -> NotificationItem (형 변환 최소)
    const items: NotificationItem[] = (data ?? []).map((row: any) => ({
      id: String(row.id),
      created_at: String(row.created_at),
      category: row.category,
      status: row.status,
      delta_credits: Number(row.delta_credits ?? 0),
      title_key: String(row.title_key),
      message_key: String(row.message_key),
      params: (row.params ?? {}) as Record<string, any>,
    }));

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "INTERNAL_ERROR", items: [] },
      { status: 500 }
    );
  }
}
