import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---- helpers (GET/POST에서 쓰던 것과 동일 컨셉) ----
function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...(extra ?? {}) }, { status });
}

function validateIdLike(v: string) {
  if (!v) return false;
  if (v.length > 128) return false;
  return true;
}

function normalizeNoteText(input: unknown) {
  const raw = String(input ?? "");
  const normalized = raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  const compact = normalized.replace(/\s+/g, "");
  return { normalized, compactLen: compact.length };
}

function getDbErrorCode(err: unknown) {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code?: unknown }).code ?? "");
  }
  return "";
}

function getDbErrorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message ?? "");
  }
  return "DB_ERROR";
}

function mapDbErrorToStatus(err: unknown) {
  const code = getDbErrorCode(err);
  if (code === "42501") return 403; // insufficient_privilege (RLS 등)
  if (code === "23503") return 404; // foreign_key_violation
  if (code === "23505") return 409; // unique_violation
  if (code === "23514" || code === "22001" || code === "22P02") return 400;

  const msg = getDbErrorMessage(err).toLowerCase();
  if (msg.includes("permission") || msg.includes("not allowed")) return 403;

  return 500;
}

function mapDbErrorToPublicMessage(err: unknown) {
  const code = getDbErrorCode(err);
  if (code === "42501") return "FORBIDDEN";
  if (code === "23503") return "NOT_FOUND";
  if (code === "23505") return "DUPLICATE";
  if (code === "23514") return "INVALID_INPUT";
  if (code === "22001") return "TEXT_TOO_LONG";
  if (code === "22P02") return "INVALID_ID";
  return getDbErrorMessage(err);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = String(id ?? "").trim();
    const body = await req.json().catch(() => ({}));
    const { normalized: text, compactLen } = normalizeNoteText(body?.text);

    if (!noteId) return jsonError(400, "id is required");
    if (!validateIdLike(noteId)) return jsonError(400, "INVALID_NOTE_ID");

    if (!text) return jsonError(400, "text is required");
    if (compactLen < 2) return jsonError(400, "text is too short"); // 너무 빡세면 1로
    if (text.length > 4000) return jsonError(400, "text is too long");

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    // NOTE: RLS가 막으면 update가 0 rows일 수 있음 -> 그 경우 404/403 처리 필요
    const { data, error } = await supabase
      .from("map_notes")
      .update({ text })
      .eq("id", noteId)
      .select("id, map_id, user_id, text, created_at, updated_at");

    if (error) {
      const status = mapDbErrorToStatus(error);
      const publicMsg = mapDbErrorToPublicMessage(error);
      return jsonError(status, publicMsg);
    }

    const item = (data ?? [])[0] ?? null;

    // 0 rows: note가 없거나(RLS 포함) 접근 불가
    // RLS가 제대로면 "내 노트가 아니면" 결과가 0일 확률이 높아서 UX 상 404로 처리하는 게 무난함
    if (!item) {
      return jsonError(404, "NOT_FOUND");
    }

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (e: unknown) {
    return jsonError(
      500,
      e instanceof Error ? e.message : "INTERNAL_ERROR"
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = String(id ?? "").trim();

    if (!noteId) return jsonError(400, "id is required");
    if (!validateIdLike(noteId)) return jsonError(400, "INVALID_NOTE_ID");

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return jsonError(401, "UNAUTHORIZED");

    // delete도 RLS에 의해 0 rows일 수 있음 -> 404로 처리하려면 select로 반환 받아야 함
    const { data, error } = await supabase
      .from("map_notes")
      .delete()
      .eq("id", noteId)
      .select("id");

    if (error) {
      const status = mapDbErrorToStatus(error);
      const publicMsg = mapDbErrorToPublicMessage(error);
      return jsonError(status, publicMsg);
    }

    const deleted = (data ?? [])[0] ?? null;
    if (!deleted) {
      return jsonError(404, "NOT_FOUND");
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: unknown) {
    return jsonError(
      500,
      e instanceof Error ? e.message : "INTERNAL_ERROR"
    );
  }
}
