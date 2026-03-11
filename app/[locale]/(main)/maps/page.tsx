"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MapListItem from "@/components/maps/MapListItem";
import MapPreviewPanel from "@/components/maps/MapPreviewPanel";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useParams, useRouter } from "next/navigation";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];
type SourceType = "youtube" | "website" | "file" | "manual";

const LIST_FIELDS =
  "id,created_at,updated_at,title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged";
const PAGE_SIZE = 20;
const TAG_LIMIT = 24;

const DATE_PRESETS = [
  { id: "7d", label: "지난 7일", days: 7 },
  { id: "30d", label: "지난 30일", days: 30 },
  { id: "90d", label: "지난 90일", days: 90 },
  { id: "1y", label: "지난 1년", days: 365 },
  { id: "all", label: "전체", days: null },
] as const;

type DatePresetId = (typeof DATE_PRESETS)[number]["id"] | "custom";
const STATUS_LABELS: Record<MapJobStatus, string> = {
  processing: "진행중",
  done: "완료",
  failed: "실패",
};
const SOURCE_LABELS: Record<SourceType, string> = {
  youtube: "유튜브",
  website: "웹",
  file: "파일",
  manual: "수동",
};

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

function startOfDayIso(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

function endOfDayIso(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next.toISOString();
}

function parseDateInput(value: string, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return endOfDay ? endOfDayIso(parsed) : startOfDayIso(parsed);
}

function SortableMergeItem({
  draft,
}: {
  draft: MapDraft;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: draft.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-[13px] shadow-sm ${
        isDragging
          ? "border-neutral-300 bg-neutral-50 text-neutral-800"
          : "border-neutral-200 bg-white text-neutral-800"
      } dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80`}
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium text-neutral-600 dark:text-white/75 line-clamp-1">
          {draft.title}
        </div>
      </div>
      <button
        type="button"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/80 dark:hover:bg-white/10"
        aria-label="드래그로 순서 변경"
        {...attributes}
        {...listeners}
      >
        <Icon icon="mdi:drag" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function MapsPage() {
  const [drafts, setDrafts] = useState<MapDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MapDraft | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<
    "created_desc" | "created_asc" | "updated_desc" | "title_asc"
  >("created_desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeRootTitle, setMergeRootTitle] = useState("");
  const [mergeOrderIds, setMergeOrderIds] = useState<string[]>([]);
  const [mergeSubmitting, setMergeSubmitting] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePresetId>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [statusFilters, setStatusFilters] = useState<MapJobStatus[]>([]);
  const [sourceFilters, setSourceFilters] = useState<SourceType[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<
    Array<{ name: string; count: number }>
  >([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [previewById, setPreviewById] = useState<
    Record<string, { status: "idle" | "loading" | "loaded" | "missing" | "error"; data: any | null }>
  >({});

  const dateRange = useMemo(() => {
    if (datePreset === "all") return { from: null, to: null };
    if (datePreset === "custom") {
      return {
        from: parseDateInput(customFrom, false),
        to: parseDateInput(customTo, true),
      };
    }
    const preset = DATE_PRESETS.find((p) => p.id === datePreset);
    if (!preset || !preset.days) return { from: null, to: null };
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - (preset.days - 1));
    return {
      from: startOfDayIso(fromDate),
      to: endOfDayIso(now),
    };
  }, [datePreset, customFrom, customTo]);

  const dateLabel = useMemo(() => {
    if (datePreset === "custom") {
      if (customFrom && customTo) return `${customFrom} ~ ${customTo}`;
      if (customFrom) return `${customFrom} 이후`;
      if (customTo) return `${customTo} 이전`;
      return "기간 선택";
    }
    const preset = DATE_PRESETS.find((p) => p.id === datePreset);
    return preset?.label ?? "기간 선택";
  }, [datePreset, customFrom, customTo]);

  const toggleArrayValue = <T,>(
    value: T,
    setter: (updater: (prev: T[]) => T[]) => void
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleSelectedMap = (draft: MapDraft) => {
    setSelectedMapIds((prev) =>
      prev.includes(draft.id)
        ? prev.filter((id) => id !== draft.id)
        : [...prev, draft.id]
    );
  };

  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleMergeDragEnd = (event: { active: { id: string }; over: { id: string } | null }) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setMergeOrderIds((prev) => {
      const oldIndex = prev.indexOf(active.id);
      const newIndex = prev.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  useEffect(() => {
    if (!mergeDialogOpen) return;
    setMergeOrderIds(selectedMapIds);
  }, [mergeDialogOpen, selectedMapIds]);

  const selectedDrafts = useMemo(
    () =>
      selectedMapIds
        .map((id) => drafts.find((draft) => draft.id === id))
        .filter((draft): draft is MapDraft => Boolean(draft)),
    [drafts, selectedMapIds]
  );

  const mergeOrderDrafts = useMemo(
    () =>
      mergeOrderIds
        .map((id) => selectedDrafts.find((draft) => draft.id === id))
        .filter((draft): draft is MapDraft => Boolean(draft)),
    [mergeOrderIds, selectedDrafts]
  );
  const mergeReady =
    mergeRootTitle.trim().length > 0 && mergeOrderDrafts.length >= 2;
  const handleMergeSubmit = async () => {
    if (!mergeReady || mergeSubmitting) return;
    try {
      setMergeSubmitting(true);
      const res = await fetch("/api/maps/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rootTitle: mergeRootTitle.trim(),
          orderedMapIds: mergeOrderIds,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "merge_failed");
      }
      toast.success("맵을 합쳤어요.");
      setMergeDialogOpen(false);
      setSelectionMode(false);
      setSelectedMapIds([]);
      setMergeRootTitle("");
      if (json?.id) {
        const nextUrl = locale ? `/${locale}/maps/${json.id}` : `/maps/${json.id}`;
        router.push(nextUrl);
      }
    } catch (error: any) {
      toast.error(
        error?.message === "merge_failed"
          ? "맵 합치기에 실패했어요."
          : "맵 합치기에 실패했어요."
      );
    } finally {
      setMergeSubmitting(false);
    }
  };


  useEffect(() => {
    if (!filtersOpen) return;
    let cancelled = false;

    (async () => {
      try {
        setTagsLoading(true);
        const params = new URLSearchParams();
        if (dateRange.from) params.set("from", dateRange.from);
        if (dateRange.to) params.set("to", dateRange.to);
        if (statusFilters.length > 0) {
          statusFilters.forEach((status) => params.append("status", status));
        }
        if (sourceFilters.length > 0) {
          sourceFilters.forEach((source) => params.append("source", source));
        }
        params.set("limit", String(TAG_LIMIT));
        const res = await fetch(`/api/maps/tags?${params.toString()}`);
        if (!res.ok) throw new Error("태그를 불러오지 못했습니다.");
        const json = (await res.json()) as {
          tags?: Array<{ name: string; count: number }>;
        };
        if (cancelled) return;
        setTagOptions(json.tags ?? []);
      } catch {
        if (cancelled) return;
        setTagOptions([]);
      } finally {
        if (!cancelled) setTagsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filtersOpen, dateRange.from, dateRange.to, statusFilters, sourceFilters]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const q = query.trim();

        let request = supabase
          .from("maps")
          .select(LIST_FIELDS, { count: "exact" })
          .range(from, to);

        if (sort === "created_desc") {
          request = request.order("created_at", { ascending: false });
        } else if (sort === "created_asc") {
          request = request.order("created_at", { ascending: true });
        } else if (sort === "updated_desc") {
          request = request.order("updated_at", {
            ascending: false,
            nullsFirst: false,
          });
        } else if (sort === "title_asc") {
          request = request.order("title", { ascending: true });
        }

        if (q) {
          const safeQuery = q.replace(/[(),{}"'\\]/g, " ").trim();
          if (safeQuery) {
            const tagToken = safeQuery.split(/\s+/)[0];
            request = request.or(
              `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,tags.cs.{${tagToken}}`
            );
          }
        }
        if (dateRange.from) {
          request = request.gte("created_at", dateRange.from);
        }
        if (dateRange.to) {
          request = request.lte("created_at", dateRange.to);
        }
        if (statusFilters.length > 0) {
          request = request.in("map_status", statusFilters);
        }
        if (sourceFilters.length > 0) {
          request = request.in("source_type", sourceFilters);
        }
        if (tagFilters.length > 0) {
          request = request.overlaps("tags", tagFilters);
        }

        const { data, error, count } = await request;

        if (cancelled) return;
        if (error) throw error;

        const rows = (data ?? []) as MapRow[];
        setDrafts(rows.map(toDraft));
        setTotalCount(count ?? 0);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "목록을 불러오지 못했습니다.");
        setDrafts([]);
        setTotalCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    query,
    sort,
    dateRange.from,
    dateRange.to,
    statusFilters,
    sourceFilters,
    tagFilters,
  ]);

  const isSearching = query.trim().length > 0;
  const hasActiveFilters =
    statusFilters.length > 0 ||
    sourceFilters.length > 0 ||
    tagFilters.length > 0 ||
    datePreset !== "7d" ||
    datePreset === "custom";
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount]
  );
  const hasDrafts = totalCount > 0;
  const hasResults = totalCount > 0;

  useEffect(() => {
    if (drafts.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      if (mobilePreviewOpen) setMobilePreviewOpen(false);
      return;
    }
    if (!selectedId || !drafts.some((draft) => draft.id === selectedId)) {
      setSelectedId(drafts[0].id);
    }
  }, [drafts, selectedId]);

  const selectedDraft = useMemo(
    () => (selectedId ? drafts.find((draft) => draft.id === selectedId) ?? null : null),
    [drafts, selectedId]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
    : !hasDrafts && !isSearching
    ? datePreset === "all"
      ? "아직 생성한 구조맵이 없어요."
      : "선택한 기간에 생성된 구조맵이 없어요."
    : !hasResults && isSearching
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

        <div
          className={`mt-6 grid gap-6 ${
            previewOpen
              ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
              : "lg:grid-cols-[minmax(0,1fr)]"
          } lg:h-[calc(100vh-160px)]`}
        >
          <section
            className={`min-w-0 lg:overflow-y-auto lg:overflow-x-hidden ${
              previewOpen ? "lg:pr-4 lg:[scrollbar-gutter:stable]" : ""
            }`}
          >
              <div className="relative">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-white/40"
              />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="맵 제목이나 태그로 검색해 보세요"
                className="
                  w-full rounded-2xl border border-neutral-400 bg-white shadow-sm
                  pl-9 pr-3 py-2 text-sm text-neutral-900
                  placeholder:text-neutral-400
                  focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200/70
                  dark:border-white/12 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/45
                  dark:focus:border-white dark:focus:ring-white/20
                "
              />
            </div>
            {selectionMode && (
              <div className="mt-2 w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-semibold text-white shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{selectedMapIds.length}개 선택됨</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMergeDialogOpen(true)}
                      disabled={selectedMapIds.length < 2}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1 hover:bg-white/15 disabled:opacity-40"
                    >
                      맵 합치기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectionMode(false);
                        setSelectedMapIds([]);
                      }}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1 hover:bg-white/15"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-white/60">
                {statusFilters.length > 0 && (
                  <span className="text-neutral-500 dark:text-white/60">
                    상태{" "}
                    {statusFilters.map((value) => STATUS_LABELS[value]).join(", ")}
                  </span>
                )}
                {sourceFilters.length > 0 && (
                  <span className="text-neutral-500 dark:text-white/60">
                    소스{" "}
                    {sourceFilters.map((value) => SOURCE_LABELS[value]).join(", ")}
                  </span>
                )}
                {tagFilters.length > 0 && (
                  <span className="text-neutral-500 dark:text-white/60">
                    태그 {tagFilters.join(", ")}
                  </span>
                )}
              </div>
              <div className="relative flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-700 dark:text-white/80">
                  {datePreset === "custom" ? dateLabel : dateLabel.replace("지난", "최근")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewOpen((prev) => !prev);
                    setMobilePreviewOpen(false);
                  }}
                  className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-700 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  {previewOpen ? "프리뷰 끄기" : "프리뷰 켜기"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode((prev) => {
                      const next = !prev;
                      if (!next) {
                        setSelectedMapIds([]);
                      } else {
                        setMobilePreviewOpen(false);
                      }
                      return next;
                    });
                  }}
                  className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-700 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  {selectionMode ? "선택 종료" : "선택"}
                </button>
                <label className="sr-only" htmlFor="maps-sort">
                  정렬
                </label>
                <select
                  id="maps-sort"
                  value={sort}
                  onChange={(event) => {
                    setSort(
                      event.target.value as
                        | "created_desc"
                        | "created_asc"
                        | "updated_desc"
                        | "title_asc"
                    );
                    setPage(1);
                  }}
                  className="rounded-full border border-neutral-400 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
                >
                  <option value="created_desc">최신 생성순</option>
                  <option value="created_asc">오래된 생성순</option>
                  <option value="updated_desc">최근 수정순</option>
                  <option value="title_asc">제목순</option>
                </select>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-white shadow-sm hover:bg-neutral-700 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                  aria-label={filtersOpen ? "필터 닫기" : "필터 열기"}
                >
                  <Icon icon="mdi:filter-variant" className="h-4 w-4" />
                </button>
                {(statusFilters.length > 0 ||
                  sourceFilters.length > 0 ||
                  tagFilters.length > 0 ||
                  datePreset !== "7d" ||
                  datePreset === "custom") && (
                  <button
                    type="button"
                    onClick={() => {
                      setDatePreset("7d");
                      setCustomFrom("");
                      setCustomTo("");
                      setStatusFilters([]);
                      setSourceFilters([]);
                      setTagFilters([]);
                      setPage(1);
                    }}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
                  >
                    필터 초기화
                  </button>
                )}
                {filtersOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setFiltersOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-40 mt-2 w-[min(560px,90vw)] rounded-2xl border border-neutral-200 bg-white p-4 text-xs text-neutral-700 shadow-lg dark:border-white/12 dark:bg-[#0b1220]/95 dark:text-white/80">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="font-semibold text-neutral-800 dark:text-white">
                            기간
                          </div>
                          <div className="flex flex-wrap gap-2">
                          {DATE_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setDatePreset(preset.id);
                                setCustomFrom("");
                                setCustomTo("");
                                setPage(1);
                              }}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                datePreset === preset.id
                                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/10"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setDatePreset("custom");
                              setPage(1);
                            }}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              datePreset === "custom"
                                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/10"
                            }`}
                          >
                            직접 선택
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="date"
                            value={customFrom}
                            onChange={(event) => {
                              setCustomFrom(event.target.value);
                              setDatePreset("custom");
                              setPage(1);
                            }}
                            className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/80"
                          />
                          <span className="text-neutral-400">~</span>
                          <input
                            type="date"
                            value={customTo}
                            onChange={(event) => {
                              setCustomTo(event.target.value);
                              setDatePreset("custom");
                              setPage(1);
                            }}
                            className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/80"
                          />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="font-semibold text-neutral-800 dark:text-white">
                            상태
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(
                              [
                                { id: "processing", label: "진행중" },
                                { id: "done", label: "완료" },
                                { id: "failed", label: "실패" },
                              ] as const
                            ).map((item) => (
                              <label
                                key={item.id}
                                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/80"
                              >
                                <input
                                  type="checkbox"
                                  checked={statusFilters.includes(item.id)}
                                  onChange={() => {
                                    toggleArrayValue(item.id, setStatusFilters);
                                    setPage(1);
                                  }}
                                />
                                {item.label}
                              </label>
                            ))}
                          </div>
                        </div>

                      <div className="flex flex-col gap-2">
                        <div className="font-semibold text-neutral-800 dark:text-white">
                          소스 타입
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              { id: "youtube", label: "유튜브" },
                              { id: "website", label: "웹" },
                              { id: "file", label: "파일" },
                              { id: "manual", label: "수동" },
                            ] as const
                          ).map((item) => (
                            <label
                              key={item.id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/80"
                            >
                              <input
                                type="checkbox"
                                checked={sourceFilters.includes(item.id)}
                                onChange={() => {
                                  toggleArrayValue(item.id, setSourceFilters);
                                  setPage(1);
                                }}
                              />
                              {item.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="font-semibold text-neutral-800 dark:text-white">
                          태그
                        </div>
                        {tagsLoading ? (
                          <div className="text-neutral-500 dark:text-white/60">
                            태그 불러오는 중…
                          </div>
                        ) : tagOptions.length === 0 ? (
                          <div className="text-neutral-500 dark:text-white/60">
                            사용할 수 있는 태그가 없어요.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {tagOptions.map((tag) => (
                              <label
                                key={tag.name}
                                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/80"
                              >
                                <input
                                  type="checkbox"
                                  checked={tagFilters.includes(tag.name)}
                                  onChange={() => {
                                    toggleArrayValue(tag.name, setTagFilters);
                                    setPage(1);
                                  }}
                                />
                                #{tag.name}
                                <span className="text-[10px] text-neutral-400">
                                  {tag.count}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
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

            {!loading && !error && !isSearching && !hasDrafts && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                {datePreset === "all" && !hasActiveFilters
                  ? "아직 생성한 구조맵이 없어요."
                  : "선택한 조건에 맞는 구조맵이 없어요."}
              </div>
            )}

            {!loading && !error && isSearching && !hasResults && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                검색 결과가 없습니다. 다른 키워드로 시도해 보세요.
              </div>
            )}

            {!loading && !error && hasResults && (
              <section className="mt-4 grid gap-2 w-full min-w-0">
                {drafts.map((draft) => (
                  <MapListItem
                    key={draft.id}
                    draft={draft}
                    selected={draft.id === selectedId}
                    selectionMode={selectionMode}
                    checked={selectedMapIds.includes(draft.id)}
                    onSelect={(item) => {
                      if (selectionMode) {
                        toggleSelectedMap(item);
                        return;
                      }
                      setSelectedId(item.id);
                      if (previewOpen) setMobilePreviewOpen(true);
                    }}
                    onToggleSelect={toggleSelectedMap}
                    onDelete={requestDelete}
                    isDeleting={deletingId === draft.id}
                  />
                ))}
              </section>
            )}

            {!loading && !error && hasResults && (
              <div className="sticky bottom-0 z-10 mt-4 flex flex-col items-end gap-2">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-neutral-700 bg-neutral-800 px-3 py-2 shadow-md">
                  <div className="text-xs font-semibold text-white/90">
                    총 {totalCount.toLocaleString()}개
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="rounded-full px-2 py-1 hover:bg-white/15 disabled:opacity-40"
                    >
                      이전
                    </button>
                    <span className="min-w-[72px] text-center">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="rounded-full px-2 py-1 hover:bg-white/15 disabled:opacity-40"
                    >
                      다음
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {previewOpen && (
            <section className="hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-160px)]">
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
          )}
        </div>
      </div>

      {/* Mobile bottom sheet preview */}
      <div className={`lg:hidden ${previewOpen ? "" : "hidden"}`}>
        <div
          className={`fixed inset-0 z-40 bg-black/25 transition-opacity ${
            mobilePreviewOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setMobilePreviewOpen(false)}
        />
        <div
          className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] transform transition-transform ${
            mobilePreviewOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-3">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-neutral-300/70 dark:bg-white/20" />
            <MapPreviewPanel
              draft={selectedDraft}
              previewData={previewData}
              previewStatus={loading ? "loading" : previewStatus}
              emptyMessage={previewEmptyMessage}
              isOpen
              onOpen={() => setMobilePreviewOpen(true)}
              onClose={() => setMobilePreviewOpen(false)}
            />
          </div>
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

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-[520px] max-h-[80vh] overflow-hidden">
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    맵 합치기
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-white/60">
                    새로운 루트를 기준으로 선택한 맵들을 자식으로 붙입니다.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-neutral-800 dark:text-white">
                      루트 노드 제목
                    </label>
                    <span className="text-xs font-semibold text-rose-600">필수</span>
                  </div>
                  <input
                    value={mergeRootTitle}
                    onChange={(event) => setMergeRootTitle(event.target.value)}
                    placeholder="예: 통합 마인드맵"
                    className={`w-full rounded-2xl border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/45 ${
                      mergeRootTitle.trim().length === 0
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200/60 dark:border-rose-400/40 dark:focus:border-rose-300 dark:focus:ring-rose-500/20"
                        : "border-neutral-300 focus:border-neutral-900 focus:ring-neutral-200/70 dark:border-white/15 dark:focus:border-white dark:focus:ring-white/20"
                    }`}
                  />
                  {mergeRootTitle.trim().length === 0 ? (
                    <p className="text-xs text-rose-600">
                      루트 제목을 입력해야 합치기를 진행할 수 있어요.
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500 dark:text-white/60">
                      입력한 루트 아래에 선택한 맵들이 순서대로 배치됩니다.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-white">
                      합칠 맵 순서
                    </h4>
                    <span className="text-xs text-neutral-500 dark:text-white/60">
                      {mergeOrderDrafts.length}개
                    </span>
                  </div>
                  {mergeOrderDrafts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                      선택된 맵이 없습니다.
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleMergeDragEnd}
                    >
                      <SortableContext
                        items={mergeOrderIds}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="max-h-[320px] overflow-y-auto pr-1">
                          <div className="flex flex-col gap-2">
                            {mergeOrderDrafts.map((draft) => (
                              <SortableMergeItem key={draft.id} draft={draft} />
                            ))}
                          </div>
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMergeDialogOpen(false)}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
              >
                닫기
              </button>
              <button
                type="button"
                disabled={!mergeReady || mergeSubmitting}
                onClick={handleMergeSubmit}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${
                  mergeReady && !mergeSubmitting
                    ? "border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"
                    : "border-neutral-300 bg-neutral-200 text-neutral-500"
                }`}
              >
                {mergeSubmitting ? "합치는 중..." : "합치기"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
