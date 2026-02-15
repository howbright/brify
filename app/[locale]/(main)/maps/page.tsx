"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import MapListItem from "@/components/maps/MapListItem";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];

const LIST_FIELDS =
  "id,created_at,updated_at,title,channel_name,source_url,source_type,tags,description,thumbnail_url,map_status,credits_charged";

function coerceMapStatus(status?: string | null): MapJobStatus {
  if (status === "done" || status === "failed" || status === "processing") {
    return status;
  }
  return "processing";
}

function withCacheBuster(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("t", Date.now().toString());
    return u.toString();
  } catch {
    return url;
  }
}

function toDraft(row: MapRow): MapDraft {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
    sourceUrl: row.source_url ?? undefined,
    sourceType: row.source_type ?? undefined,
    title: row.title ?? "제목없음",
    channelName: row.channel_name ?? undefined,
    thumbnailUrl: row.thumbnail_url ? withCacheBuster(row.thumbnail_url) : undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    description: row.description ?? undefined,
    status: coerceMapStatus(row.map_status),
    creditsCharged:
      typeof row.credits_charged === "number" ? row.credits_charged : undefined,
  };
}

export default function MapsPage() {
  const [drafts, setDrafts] = useState<MapDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);


  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("maps")
          .select(LIST_FIELDS)
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (error) throw error;

        const rows = (data ?? []) as MapRow[];
        setDrafts(rows.map(toDraft));
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "목록을 불러오지 못했습니다.");
        setDrafts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);


  const hasDrafts = useMemo(() => drafts.length > 0, [drafts.length]);

  const handleDelete = async (draft: MapDraft) => {
    if (!draft?.id) return;

    const confirmed = window.confirm("이 구조맵을 삭제할까요? 삭제 후 복구할 수 없어요.");
    if (!confirmed) return;

    try {
      setDeletingId(draft.id);
      const supabase = createClient();
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        throw new Error("세션을 가져오지 못했습니다: " + sessionErr.message);
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error("환경변수 NEXT_PUBLIC_API_BASE_URL이 없습니다.");
      }

      const res = await fetch(`${base}/maps/${draft.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.message || json?.error || "요청 실패";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
      }

      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    } catch (e: any) {
      const msg = e?.message ?? "삭제에 실패했습니다.";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-[70vh] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              나의 맵
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-white/60">
              생성한 구조맵 목록을 확인할 수 있어요.
            </p>
          </div>
          <Link
            href="/video-to-map"
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            새 구조맵 만들기
          </Link>
        </div>

        {loading && (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
            목록 불러오는 중…
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && !hasDrafts && (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
            아직 생성한 구조맵이 없어요.
          </div>
        )}

        {hasDrafts && (
          <section className="mt-6 grid gap-3">
            {drafts.map((draft) => (
              <MapListItem
                key={draft.id}
                draft={draft}
                onDelete={handleDelete}
                isDeleting={deletingId === draft.id}
              />
            ))}
          </section>
        )}
      </div>

    </main>
  );
}
