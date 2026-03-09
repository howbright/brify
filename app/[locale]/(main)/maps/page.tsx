"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import MapListItem from "@/components/maps/MapListItem";
import MapPreviewPanel from "@/components/maps/MapPreviewPanel";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];

const LIST_FIELDS =
  "id,created_at,updated_at,title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged";

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
    summary: row.summary ?? undefined,
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MapDraft | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewById, setPreviewById] = useState<
    Record<string, { status: "idle" | "loading" | "loaded" | "missing" | "error"; data: any | null }>
  >({});


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

  const filteredDrafts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drafts;
    return drafts.filter((draft) => {
      const titleMatch = draft.title.toLowerCase().includes(q);
      const tagMatch = draft.tags?.some((tag) => tag.toLowerCase().includes(q));
      return titleMatch || Boolean(tagMatch);
    });
  }, [drafts, query]);

  const hasDrafts = drafts.length > 0;
  const hasResults = filteredDrafts.length > 0;

  useEffect(() => {
    if (filteredDrafts.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredDrafts.some((draft) => draft.id === selectedId)) {
      setSelectedId(filteredDrafts[0].id);
    }
  }, [filteredDrafts, selectedId]);

  const selectedDraft = useMemo(
    () => (selectedId ? filteredDrafts.find((draft) => draft.id === selectedId) ?? null : null),
    [filteredDrafts, selectedId]
  );

  useEffect(() => {
    if (!selectedId) return;
    const existing = previewById[selectedId];
    if (existing && existing.status !== "idle") return;

    let cancelled = false;

    (async () => {
      try {
        setPreviewById((prev) => ({
          ...prev,
          [selectedId]: { status: "loading", data: existing?.data ?? null },
        }));

        const supabase = createClient();
        const { data, error } = await supabase
          .from("maps")
          .select("id,mind_elixir,mind_elixir_draft")
          .eq("id", selectedId)
          .single();

        if (cancelled) return;
        if (error) throw error;

        const effectiveMind = data?.mind_elixir_draft ?? data?.mind_elixir ?? null;
        if (!effectiveMind) {
          setPreviewById((prev) => ({
            ...prev,
            [selectedId]: { status: "missing", data: null },
          }));
          return;
        }

        setPreviewById((prev) => ({
          ...prev,
          [selectedId]: { status: "loaded", data: effectiveMind },
        }));
      } catch {
        if (cancelled) return;
        setPreviewById((prev) => ({
          ...prev,
          [selectedId]: { status: "error", data: null },
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const handleDelete = async (draft: MapDraft) => {
    if (!draft?.id) return;
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

  const requestDelete = (draft: MapDraft) => {
    setPendingDelete(draft);
    setConfirmOpen(true);
  };

  const previewState = selectedId ? previewById[selectedId] : null;
  const previewStatus = selectedId
    ? previewState?.status ?? "loading"
    : "idle";
  const previewData = previewState?.data ?? null;

  const previewEmptyMessage = loading
    ? "목록을 불러오는 중이에요."
    : !hasDrafts
    ? "아직 생성한 구조맵이 없어요."
    : !hasResults
    ? "검색 결과가 없어요."
    : "좌측에서 맵을 선택해 주세요.";

  return (
    <main className="min-h-[70vh] px-6 pt-20 pb-12">
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
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:h-[calc(100vh-160px)]">
          <section className="min-w-0 lg:overflow-y-auto lg:overflow-x-hidden lg:pr-4 lg:[scrollbar-gutter:stable]">
            <div className="relative">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-white/40"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="맵 제목이나 태그로 검색해 보세요"
                className="
                  w-full rounded-2xl border border-neutral-300 bg-white shadow-sm
                  pl-9 pr-3 py-2 text-sm text-neutral-900
                  placeholder:text-neutral-500
                  focus:border-neutral-900 focus:outline-none focus:ring-0
                  dark:border-white/20 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-white/55
                  dark:focus:border-white
                "
              />
            </div>

            {loading && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                목록 불러오는 중…
              </div>
            )}

            {!loading && error && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            )}

            {!loading && !error && !hasDrafts && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                아직 생성한 구조맵이 없어요.
              </div>
            )}

            {!loading && !error && hasDrafts && !hasResults && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                검색 결과가 없습니다. 다른 키워드로 시도해 보세요.
              </div>
            )}

            {!loading && !error && hasResults && (
              <section className="mt-4 grid gap-2 w-full min-w-0">
                {filteredDrafts.map((draft) => (
                  <MapListItem
                    key={draft.id}
                    draft={draft}
                    selected={draft.id === selectedId}
                    onSelect={(item) => setSelectedId(item.id)}
                    onDelete={requestDelete}
                    isDeleting={deletingId === draft.id}
                  />
                ))}
              </section>
            )}
          </section>

          <section className="lg:sticky lg:top-24 lg:h-[calc(100vh-160px)]">
            <MapPreviewPanel
              draft={selectedDraft}
              previewData={previewData}
              previewStatus={loading ? "loading" : previewStatus}
              emptyMessage={previewEmptyMessage}
              isOpen={previewOpen}
              onOpen={() => setPreviewOpen(true)}
              onClose={() => setPreviewOpen(false)}
            />
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          if (!pendingDelete) return;
          setConfirmOpen(false);
          handleDelete(pendingDelete);
          setPendingDelete(null);
        }}
        title="구조맵을 삭제할까요?"
        description="삭제하면 복구할 수 없어요. 계속 진행할까요?"
        actionLabel="삭제"
      />
    </main>
  );
}
