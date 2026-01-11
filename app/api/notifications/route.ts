// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type {
  NotificationItem,
  NotificationCategory,
  NotificationStatus,
  NotificationEventType,
  NotificationParams,
} from "@/app/types/notice";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toInt(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ✅ DB(Json) → next-intl용 params로 최소 정리
// - string/number만 남기고 나머지(boolean/null/undefined/object/array)는 버림
function normalizeParams(input: unknown): NotificationParams {
  if (!input || typeof input !== "object") return {};
  const obj = input as Record<string, unknown>;
  const out: Record<string, string | number | Date> = {};

  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" || typeof v === "number") out[k] = v;
    // 혹시 서버에서 Date를 직접 넣는 케이스만 허용
    else if (v instanceof Date) out[k] = v;
  }

  return out;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(
      Math.max(toInt(url.searchParams.get("limit"), 5), 1),
      30
    );

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // 로그인 안 되어있으면 빈 배열 반환
    if (sessionError || !session?.user) {
      return NextResponse.json({ ok: true, items: [] }, { status: 200 });
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, created_at, category, status, event_type, delta_credits, title_key, message_key, params"
      )
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, items: [] },
        { status: 500 }
      );
    }

    const items: NotificationItem[] = (data ?? []).map((row: any) => ({
      id: String(row.id),
      created_at: String(row.created_at),

      category: row.category as NotificationCategory,
      status: row.status as NotificationStatus,
      event_type: row.event_type as NotificationEventType,

      delta_credits: Number(row.delta_credits ?? 0),

      title_key: String(row.title_key),
      message_key: String(row.message_key),

      params: row.params ? normalizeParams(row.params) : null,
    }));

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "INTERNAL_ERROR", items: [] },
      { status: 500 }
    );
  }
}
