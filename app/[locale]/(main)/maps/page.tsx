"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
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
import TagEditDialog from "@/components/maps/TagEditDialog";
import TagPanel from "@/components/maps/TagPanel";
import MapListToolbar from "@/components/maps/MapListToolbar";
import MapCardList from "@/components/maps/MapCardList";
import MapTableList from "@/components/maps/MapTableList";
import MapFilterPopover from "@/components/maps/MapFilterPopover";
import TagMergeDialog from "@/components/maps/TagMergeDialog";
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
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
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
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [tagOrganizeMode, setTagOrganizeMode] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePresetId>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [statusFilters, setStatusFilters] = useState<MapJobStatus[]>([]);
  const [sourceFilters, setSourceFilters] = useState<SourceType[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<
    Array<{ name: string; count: number }>
  >([]);
  const [recentTagOptions, setRecentTagOptions] = useState<
    Array<{ name: string; count: number }>
  >([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagListQuery, setTagListQuery] = useState("");
  const [tagDeleteTarget, setTagDeleteTarget] = useState<string | null>(null);
  const [tagDeleteOpen, setTagDeleteOpen] = useState(false);
  const [tagDeleteSubmitting, setTagDeleteSubmitting] = useState(false);
  const [tagEditOpen, setTagEditOpen] = useState(false);
  const [tagEditDraft, setTagEditDraft] = useState<MapDraft | null>(null);
  const [tagEditSubmitting, setTagEditSubmitting] = useState(false);
  const [tagMergeOpen, setTagMergeOpen] = useState(false);
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [tagRefreshKey, setTagRefreshKey] = useState(0);
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

  const handleMergeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setMergeOrderIds((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
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
  const tagQuery = tagListQuery.trim().toLowerCase();
  const recentTagOptionsFiltered = useMemo(() => {
    if (!tagQuery) return recentTagOptions;
    return recentTagOptions.filter((tag) =>
      tag.name.toLowerCase().includes(tagQuery)
    );
  }, [recentTagOptions, tagQuery]);
  const allTagOptionsFiltered = useMemo(() => {
    if (!tagQuery) return tagOptions;
    return tagOptions.filter((tag) =>
      tag.name.toLowerCase().includes(tagQuery)
    );
  }, [tagOptions, tagQuery]);
  const filteredDrafts = useMemo(() => drafts, [drafts]);
  const effectiveTagFilters = useMemo(
    () => (tagOrganizeMode ? selectedTagNames : tagFilters),
    [selectedTagNames, tagOrganizeMode, tagFilters]
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

  const handleItemSelect = (item: MapDraft) => {
    if (selectionMode) {
      toggleSelectedMap(item);
      return;
    }
    if (!previewOpen) {
      setSelectedId(item.id);
      return;
    }
    setSelectedId(item.id);
    setMobilePreviewOpen(true);
  };

  const handleOpenDetail = (item: MapDraft) => {
    const nextUrl = locale ? `/${locale}/maps/${item.id}` : `/maps/${item.id}`;
    router.push(nextUrl);
  };


  useEffect(() => {
    if (!filtersOpen && !tagOrganizeMode) return;
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
          recent?: Array<{ name: string; count: number }>;
        };
        if (cancelled) return;
        setTagOptions(json.tags ?? []);
        setRecentTagOptions(json.recent ?? []);
      } catch {
        if (cancelled) return;
        setTagOptions([]);
        setRecentTagOptions([]);
      } finally {
        if (!cancelled) setTagsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    filtersOpen,
    tagOrganizeMode,
    dateRange.from,
    dateRange.to,
    statusFilters,
    sourceFilters,
    tagRefreshKey,
  ]);

  useEffect(() => {
    if (!tagOrganizeMode) {
      setSelectedTagNames([]);
    }
  }, [tagOrganizeMode]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const q = tagOrganizeMode ? "" : query.trim();

        let request = supabase.from("maps").select(LIST_FIELDS, { count: "exact" });

        if (sort === "created_desc") {
          request = request.range(from, to);
          request = request.order("created_at", { ascending: false });
        } else if (sort === "created_asc") {
          request = request.range(from, to);
          request = request.order("created_at", { ascending: true });
        } else if (sort === "updated_desc") {
          request = request.range(from, to);
          request = request.order("updated_at", {
            ascending: false,
            nullsFirst: false,
          });
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
        if (effectiveTagFilters.length > 0) {
          request = request.overlaps("tags", effectiveTagFilters);
        }

        const { data, error, count } = await request;

        if (cancelled) return;
        if (error) throw error;

        const rows = (data ?? []) as MapRow[];

        if (sort === "title_asc") {
          const collator = new Intl.Collator(locale ?? "en", {
            numeric: true,
            sensitivity: "base",
          });
          const sortedRows = [...rows].sort((a, b) => {
            const compared = collator.compare(a.title ?? "", b.title ?? "");
            if (compared !== 0) return compared;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          const pagedRows = sortedRows.slice(from, to + 1);
          setDrafts(pagedRows.map(toDraft));
          setTotalCount(sortedRows.length);
        } else {
          setDrafts(rows.map(toDraft));
          setTotalCount(count ?? 0);
        }
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
    effectiveTagFilters,
    tagOrganizeMode,
    locale,
  ]);

  const isSearching = !tagOrganizeMode && query.trim().length > 0;
  const hasActiveFilters =
    statusFilters.length > 0 ||
    sourceFilters.length > 0 ||
    tagFilters.length > 0 ||
    datePreset !== "30d";
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount]
  );
  const hasDrafts = totalCount > 0;
  const hasFilteredDrafts = filteredDrafts.length > 0;
  const hasResults = totalCount > 0;
  const statusSummary =
    statusFilters.length > 0
      ? statusFilters.map((value) => STATUS_LABELS[value]).join(", ")
      : null;
  const sourceSummary =
    sourceFilters.length > 0
      ? sourceFilters.map((value) => SOURCE_LABELS[value]).join(", ")
      : null;
  const tagSummary =
    effectiveTagFilters.length > 0 ? effectiveTagFilters.join(", ") : null;

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

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      setBulkDeleting(true);
      const res = await fetch("/api/maps/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "요청 실패");
      }

      const deletedIds: string[] = Array.isArray(json?.deleted)
        ? json.deleted
        : [];

      if (deletedIds.length > 0) {
        setDrafts((prev) => prev.filter((d) => !deletedIds.includes(d.id)));
      }

      const failed = ids.length - deletedIds.length;
      if (failed === 0) {
        toast.success(`${deletedIds.length}개 삭제했습니다.`);
      } else {
        toast.error(`${deletedIds.length}개 삭제, ${failed}개는 실패했습니다.`);
      }
    } catch (e: any) {
      const msg = e?.message ?? "삭제에 실패했습니다.";
      toast.error(msg);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleTagDelete = async (tagName: string) => {
    if (!tagName || tagDeleteSubmitting) return;
    try {
      setTagDeleteSubmitting(true);
      const res = await fetch("/api/maps/tags/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: tagName }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "요청 실패");
      }

      setDrafts((prev) =>
        prev.map((draft) => ({
          ...draft,
          tags: (draft.tags ?? []).filter((t) => t !== tagName),
        }))
      );
      setTagOptions((prev) => prev.filter((tag) => tag.name !== tagName));
      setRecentTagOptions((prev) => prev.filter((tag) => tag.name !== tagName));
      setManualTags((prev) => prev.filter((name) => name !== tagName));
      setSelectedTagNames((prev) => prev.filter((name) => name !== tagName));
      toast.success(`#${tagName} 태그를 삭제했어요.`);
    } catch (e: any) {
      const msg = e?.message ?? "태그 삭제에 실패했습니다.";
      toast.error(msg);
    } finally {
      setTagDeleteSubmitting(false);
    }
  };

  const handleTagMerge = async (targetTag: string) => {
    const sources = selectedTagNames.filter(Boolean);
    if (!targetTag || sources.length < 2) return;
    try {
      const res = await fetch("/api/maps/tags/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetTag, sourceTags: sources }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "요청 실패");
      }
      setDrafts((prev) =>
        prev.map((draft) => {
          const tags = Array.isArray(draft.tags) ? draft.tags : [];
          const next = tags.map((tag) =>
            sources.includes(tag) ? targetTag : tag
          );
          const seen = new Set<string>();
          const deduped = next.filter((tag) => {
            const key = tag.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          return { ...draft, tags: deduped };
        })
      );
      setSelectedTagNames([targetTag]);
      setTagMergeOpen(false);
      setTagRefreshKey((prev) => prev + 1);
      toast.success("태그를 합쳤어요.");
    } catch (e: any) {
      const msg = e?.message ?? "태그 합치기에 실패했습니다.";
      toast.error(msg);
    }
  };
  const openTagEditor = (draft: MapDraft) => {
    setTagEditDraft(draft);
    setTagEditOpen(true);
  };

  const handleTagEditSave = async (tags: string[]) => {
    if (!tagEditDraft || tagEditSubmitting) return;
    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
    const unique = Array.from(new Set(normalized));
    try {
      setTagEditSubmitting(true);
      const res = await fetch("/api/maps/tags/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mapId: tagEditDraft.id, tags: unique }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "요청 실패");
      }
      const nextTags: string[] = Array.isArray(json?.tags) ? json.tags : unique;
      setDrafts((prev) =>
        prev.map((draft) =>
          draft.id === tagEditDraft.id ? { ...draft, tags: nextTags } : draft
        )
      );
      setTagRefreshKey((prev) => prev + 1);
      setTagEditOpen(false);
      setTagEditDraft(null);
      toast.success("태그를 업데이트했어요.");
    } catch (e: any) {
      const msg = e?.message ?? "태그 업데이트에 실패했습니다.";
      toast.error(msg);
    } finally {
      setTagEditSubmitting(false);
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
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              나의 맵
            </h1>
          </div>
        </div>

        <div
          className={`mt-4 grid gap-6 ${
            tagOrganizeMode
              ? "lg:grid-cols-[minmax(0,0.32fr)_minmax(0,0.68fr)]"
              : previewOpen
              ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
              : "lg:grid-cols-[minmax(0,1fr)]"
          } lg:h-[calc(100vh-160px)]`}
        >
          {tagOrganizeMode && (
            <TagPanel
              tagListQuery={tagListQuery}
              onTagListQueryChange={setTagListQuery}
              tagsLoading={tagsLoading}
              recentTagOptions={recentTagOptionsFiltered}
              allTagOptions={allTagOptionsFiltered}
              onDeleteTag={(tag) => {
                setTagDeleteTarget(tag);
                setTagDeleteOpen(true);
              }}
              selectedTags={selectedTagNames}
              onToggleSelect={(tag) => {
                setSelectedTagNames((prev) =>
                  prev.includes(tag)
                    ? prev.filter((name) => name !== tag)
                    : [...prev, tag]
                );
                setPage(1);
              }}
              onOpenMerge={() => setTagMergeOpen(true)}
            />
          )}
          <section
            className={`min-w-0 lg:overflow-y-auto lg:overflow-x-hidden ${
              previewOpen ? "lg:pr-4 lg:[scrollbar-gutter:stable]" : ""
            }`}
          >
            <MapListToolbar
              query={query}
              onQueryChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              onClearQuery={() => {
                setQuery("");
                setPage(1);
              }}
              selectionMode={selectionMode}
              selectedCount={selectedMapIds.length}
              onOpenMerge={() => setMergeDialogOpen(true)}
              onOpenBulkDelete={() => setConfirmBulkOpen(true)}
              onCancelSelection={() => {
                setSelectionMode(false);
                setSelectedMapIds([]);
              }}
              bulkDeleting={bulkDeleting}
              statusSummary={statusSummary}
              sourceSummary={sourceSummary}
              tagSummary={tagSummary}
              dateLabel={dateLabel}
              datePreset={datePreset}
              previewOpen={previewOpen}
              onTogglePreview={() => {
                const next = !previewOpen;
                if (next && selectionMode) {
                  setSelectionMode(false);
                  setSelectedMapIds([]);
                  toast.message("프리뷰 모드로 전환되어 선택 모드가 꺼졌어요.");
                }
                if (next && tagOrganizeMode) {
                  setTagOrganizeMode(false);
                  toast.message("프리뷰를 위해 태그 정리 모드를 껐어요.");
                }
                setPreviewOpen(next);
                setMobilePreviewOpen(false);
              }}
              tagOrganizeMode={tagOrganizeMode}
              onToggleTagOrganize={() => {
                const next = !tagOrganizeMode;
                if (next && previewOpen) {
                  setPreviewOpen(false);
                  setMobilePreviewOpen(false);
                  toast.message("태그 정리 모드로 전환되어 프리뷰가 꺼졌어요.");
                }
                setTagOrganizeMode(next);
              }}
              onToggleSelection={() => {
                const next = !selectionMode;
                if (!next) {
                  setSelectionMode(false);
                  setSelectedMapIds([]);
                  return;
                }
                if (previewOpen) {
                  setPreviewOpen(false);
                  setMobilePreviewOpen(false);
                  toast.message("선택 모드로 전환되어 프리뷰가 꺼졌어요.");
                }
                setSelectionMode(true);
              }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sort={sort}
              onSortChange={(value) => {
                setSort(value);
                setPage(1);
              }}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen((prev) => !prev)}
              showResetFilters={
                statusFilters.length > 0 ||
                sourceFilters.length > 0 ||
                tagFilters.length > 0 ||
                datePreset !== "30d"
              }
              onResetFilters={() => {
                setDatePreset("30d");
                setCustomFrom("");
                setCustomTo("");
                setStatusFilters([]);
                setSourceFilters([]);
                setTagFilters([]);
                setPage(1);
              }}
              filterPopover={
                <MapFilterPopover
                  datePreset={datePreset}
                  onDatePresetChange={(value) => {
                    if (value === "custom") {
                      setDatePreset("custom");
                      setPage(1);
                      return;
                    }
                    setDatePreset(value as typeof datePreset);
                    setCustomFrom("");
                    setCustomTo("");
                    setPage(1);
                  }}
                  customFrom={customFrom}
                  customTo={customTo}
                  onCustomFromChange={(value) => {
                    setCustomFrom(value);
                    setDatePreset("custom");
                    setPage(1);
                  }}
                  onCustomToChange={(value) => {
                    setCustomTo(value);
                    setDatePreset("custom");
                    setPage(1);
                  }}
                  statusFilters={statusFilters}
                  onToggleStatus={(value) => {
                    toggleArrayValue(value, setStatusFilters);
                    setPage(1);
                  }}
                  sourceFilters={sourceFilters}
                  onToggleSource={(value) => {
                    toggleArrayValue(value, setSourceFilters);
                    setPage(1);
                  }}
                  tagFilters={tagFilters}
                  tagOptions={tagOptions}
                  tagsLoading={tagsLoading}
                  onToggleTag={(value) => {
                    toggleArrayValue(value, setTagFilters);
                    setPage(1);
                  }}
                  showTagFilters={!tagOrganizeMode}
                  onClose={() => setFiltersOpen(false)}
                />
              }
            />

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

            {!loading &&
              !error &&
              tagOrganizeMode &&
              selectedTagNames.length > 0 &&
              !hasFilteredDrafts && (
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                  선택한 태그가 붙은 맵이 없어요.
                </div>
              )}

            {!loading && !error && hasResults && (
              <>
                {viewMode === "card" ? (
                  <MapCardList
                    drafts={filteredDrafts}
                    selectedId={selectedId}
                    previewOpen={previewOpen}
                    selectionMode={selectionMode}
                    tagOrganizeMode={tagOrganizeMode}
                    selectedMapIds={selectedMapIds}
                    onSelect={handleItemSelect}
                    onToggleSelect={toggleSelectedMap}
                    onEditTags={openTagEditor}
                    onOpenDetail={handleOpenDetail}
                    showOpenDetail
                  />
                ) : (
                  <MapTableList
                    drafts={filteredDrafts}
                    selectedId={selectedId}
                    previewOpen={previewOpen}
                    selectionMode={selectionMode}
                    tagOrganizeMode={tagOrganizeMode}
                    selectedMapIds={selectedMapIds}
                    onSelect={handleItemSelect}
                    onToggleSelect={toggleSelectedMap}
                    onEditTags={openTagEditor}
                    showEditTags={tagOrganizeMode}
                    onOpenDetail={handleOpenDetail}
                    showOpenDetail
                    statusLabels={STATUS_LABELS}
                    sourceLabels={SOURCE_LABELS}
                  />
                )}
              </>
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

          {previewOpen && !tagOrganizeMode && (
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

      <ConfirmDialog
        open={confirmBulkOpen}
        onOpenChange={setConfirmBulkOpen}
        onConfirm={() => {
          const ids = [...selectedMapIds];
          setConfirmBulkOpen(false);
          handleBulkDelete(ids);
          setSelectionMode(false);
          setSelectedMapIds([]);
        }}
        title="선택한 구조맵을 삭제할까요?"
        description="선택한 맵을 삭제하면 복구할 수 없어요."
        actionLabel="선택 삭제"
      />

      <ConfirmDialog
        open={tagDeleteOpen}
        onOpenChange={setTagDeleteOpen}
        onConfirm={() => {
          if (!tagDeleteTarget) return;
          setTagDeleteOpen(false);
          handleTagDelete(tagDeleteTarget);
          setTagDeleteTarget(null);
        }}
        title="태그를 삭제할까요?"
        description={
          tagDeleteTarget ? (
            <span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                #{tagDeleteTarget}
              </span>{" "}
              태그가 모든 맵에서 삭제됩니다. 계속할까요?
            </span>
          ) : (
            "선택한 태그가 모든 맵에서 삭제됩니다. 계속할까요?"
          )
        }
        actionLabel={tagDeleteSubmitting ? "삭제 중..." : "삭제"}
      />

      <TagEditDialog
        open={tagEditOpen}
        onOpenChange={setTagEditOpen}
        draftTitle={tagEditDraft?.title ?? "선택한 맵"}
        initialTags={tagEditDraft?.tags ?? []}
        allTags={tagOptions.map((tag) => tag.name)}
        saving={tagEditSubmitting}
        onSave={handleTagEditSave}
      />

      <TagMergeDialog
        open={tagMergeOpen}
        onOpenChange={setTagMergeOpen}
        selectedTags={selectedTagNames}
        onConfirm={handleTagMerge}
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
                    ? "border-neutral-600 bg-neutral-700 text-white hover:bg-neutral-600"
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
