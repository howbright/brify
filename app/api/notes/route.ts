import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---- helpers ----
function toPositiveInt(v: string | null, fallback: number) {
  if (v == null) return fallback;
  const s = String(v).trim();
  if (!s) return fallback;

  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return fallback;
  return n;
}

// 너무 빡세게 막진 않고, "공백/줄바꿈만 잔뜩" 같은 케이스만 걸러주는 정도
function normalizeNoteText(input: unknown) {
  const raw = String(input ?? "");
  // 줄바꿈 통일 + 끝 공백 제거
  const normalized = raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  // 모든 공백 제거했을 때 아무것도 없으면 의미 없는 입력
  const compact = normalized.replace(/\s+/g, "");
  return { normalized, compactLen: compact.length };
}

// UUID 형태면 좋지만, 꼭 UUID가 아닐 수도 있으니(예: cuid) 너무 강제하진 않음.
// 다만 빈 값, 너무 긴 값 같은 이상치는 걸러주기.
function validateIdLike(v: string) {
  if (!v) return false;
  if (v.length > 128) return false;
  return true;
}

function jsonError(
  status: number,
  error: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ ok: false, error, ...(extra ?? {}) }, { status });
}

function mapDbErrorToStatus(err: any) {
  // supabase-js PostgrestError 기준: { code, message, details, hint }
  const code = String(err?.code ?? "");
  // 주요 PG 에러 코드들:
  // 42501 insufficient_privilege (RLS 등 권한)
  // 23503 foreign_key_violation (map_id FK 걸려있으면 "맵 없음"으로 활용 가능)
  // 23505 unique_violation
  // 23514 check_violation
  // 22001 string_data_right_truncation (길이 초과)
  // 22P02 invalid_text_representation
  if (code === "42501") return 403;
  if (code === "23503") return 404;
  if (code === "23505") return 409;
  if (code === "23514" || code === "22001" || code === "22P02") return 400;

  // PostgREST 전용 코드가 들어오는 경우도 있어서 fallback
  // RLS 차단이지만 400/500으로 오는 케이스가 있으면 details/message로 보정
  const msg = String(err?.message ?? "").toLowerCase();
  if (msg.includes("permission") || msg.includes("not allowed")) return 403;

  return 500;
}

function mapDbErrorToPublicMessage(err: any) {
  const code = String(err?.code ?? "");
  if (code === "42501") return "FORBIDDEN";
  if (code === "23503") return "MAP_NOT_FOUND";
  if (code === "23505") return "DUPLICATE";
  if (code === "23514") return "INVALID_INPUT";
  if (code === "22001") return "TEXT_TOO_LONG";
  if (code === "22P02") return "INVALID_ID";
  return String(err?.message ?? "DB_ERROR");
}

// ---- handlers ----
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const mapId = String(url.searchParams.get("mapId") ?? "").trim();
    const limit = Math.min(
      Math.max(toPositiveInt(url.searchParams.get("limit"), 50), 1),
      200
    );

    if (!mapId) return jsonError(400, "mapId is required");
    if (!validateIdLike(mapId)) return jsonError(400, "INVALID_MAP_ID");

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    const { data, error } = await supabase
      .from("map_notes")
      .select("id, map_id, user_id, text, created_at, updated_at")
      .eq("map_id", mapId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      const status = mapDbErrorToStatus(error);
      const publicMsg = mapDbErrorToPublicMessage(error);
      return jsonError(status, publicMsg);
    }

    return NextResponse.json({ ok: true, items: data ?? [] }, { status: 200 });
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mapId = String(body?.mapId ?? "").trim();

    const { normalized, compactLen } = normalizeNoteText(body?.text);

    if (!mapId) return jsonError(400, "mapId is required");
    if (!validateIdLike(mapId)) return jsonError(400, "INVALID_MAP_ID");

    if (!normalized) return jsonError(400, "text is required");
    if (compactLen < 2) return jsonError(400, "text is too short"); // 너무 빡세면 1로 낮춰도 됨
    if (normalized.length > 4000) return jsonError(400, "text is too long");

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    const { data, error } = await supabase
      .from("map_notes")
      .insert({ map_id: mapId, user_id: user.id, text: normalized })
      .select("id, map_id, user_id, text, created_at, updated_at")
      .single();

    if (error) {
      const status = mapDbErrorToStatus(error);
      const publicMsg = mapDbErrorToPublicMessage(error);
      return jsonError(status, publicMsg);
    }

    return NextResponse.json({ ok: true, item: data }, { status: 201 });
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
