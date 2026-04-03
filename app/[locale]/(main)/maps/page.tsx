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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MapPreviewPanel from "@/components/maps/MapPreviewPanel";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import TagEditDialog from "@/components/maps/TagEditDialog";
import TagPanel from "@/components/maps/TagPanel";
import MapListToolbar from "@/components/maps/MapListToolbar";
import MapCardList from "@/components/maps/MapCardList";
import MapTableList from "@/components/maps/MapTableList";
import MapsRecentSections from "@/components/maps/MapsRecentSections";
import MobileTagSheet from "@/components/maps/MobileTagSheet";
import useMapSelectionMerge from "@/components/maps/useMapSelectionMerge";
import useMapPreview from "@/components/maps/useMapPreview";
import useMapTags from "@/components/maps/useMapTags";
import useMapsListControls from "@/components/maps/useMapsListControls";
import useMapDeletion from "@/components/maps/useMapDeletion";
import useMapsListQuery from "@/components/maps/useMapsListQuery";
import useRecentMaps from "@/components/maps/useRecentMaps";
import { usePinnedPanel, usePinnedToolbar } from "@/components/maps/usePinnedLayout";
import MapFilterPopover from "@/components/maps/MapFilterPopover";
import TagMergeDialog from "@/components/maps/TagMergeDialog";
import { useParams, useRouter } from "next/navigation";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";
import type { Database } from "@/app/types/database.types";
import { useRef } from "react";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];
type SourceType = "youtube" | "website" | "file" | "manual";

const LIST_FIELDS =
  "id,created_at,updated_at,title,short_title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged";
const PAGE_SIZE = 20;
const NO_TAG_FILTER = "__NO_TAG__";

const STATUS_LABELS: Record<MapJobStatus, string> = {
  idle: "대기중",
  queued: "대기중",
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
    shortTitle: row.short_title ?? undefined,
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

function getMapListDisplayTitle(draft: MapDraft) {
  const baseTitle = draft.shortTitle?.trim() || draft.title;
  const channel = draft.channelName?.trim();
  return channel ? `${baseTitle} [${channel}]` : baseTitle;
}

function MapCardListSkeleton() {
  return (
    <section className="mt-4 grid gap-2 w-full min-w-0">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0f172a]/40"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3 flex-1">
              <div className="h-[60px] w-20 shrink-0 animate-pulse rounded-xl bg-neutral-200 dark:bg-white/10" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
                <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
              </div>
            </div>
            <div className="h-7 w-14 shrink-0 animate-pulse rounded-full bg-neutral-100 dark:bg-white/5" />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-white/5" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-neutral-100 dark:bg-white/5" />
            <div className="h-5 w-12 animate-pulse rounded-full bg-neutral-100 dark:bg-white/5" />
          </div>
        </div>
      ))}
    </section>
  );
}

function MapTableListSkeleton() {
  return (
    <div className="mt-4 w-full min-w-0 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1220]/70">
      <table className="w-full table-fixed text-left text-[12px] [table-layout:fixed]">
        <thead className="text-[11px] font-semibold text-neutral-600 dark:text-white/70">
          <tr className="border-b border-neutral-300 bg-neutral-50/80 dark:border-white/15 dark:bg-white/[0.04]">
            <th className="px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">제목</th>
            <th className="w-[64px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">상태</th>
            <th className="w-[64px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">소스</th>
            <th className="w-[120px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">태그</th>
            <th className="w-[110px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">생성일</th>
            <th className="w-[110px] px-2 py-1.5">수정일</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 7 }).map((_, index) => (
            <tr key={index} className="border-b border-neutral-200 dark:border-white/10">
              <td className="px-2 py-2 border-r border-neutral-200 dark:border-white/10">
                <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
              </td>
              <td className="px-2 py-2 border-r border-neutral-200 dark:border-white/10">
                <div className="h-4 w-10 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
              </td>
              <td className="px-2 py-2 border-r border-neutral-200 dark:border-white/10">
                <div className="h-4 w-10 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
              </td>
              <td className="px-2 py-2 border-r border-neutral-200 dark:border-white/10">
                <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
              </td>
              <td className="px-2 py-2 border-r border-neutral-200 dark:border-white/10">
                <div className="h-4 w-16 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
              </td>
              <td className="px-2 py-2">
                <div className="h-4 w-16 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MapPreviewSkeleton() {
  return (
    <section className="hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-160px)]">
      <aside className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="h-5 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
        <div className="mt-2 h-3 w-24 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
        <div className="mt-4 h-[360px] animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/5" />
        <div className="mt-3 h-3 w-5/6 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
      </aside>
    </section>
  );
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
          {getMapListDisplayTitle(draft)}
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
  const listSectionRef = useRef<HTMLElement | null>(null);
  const toolbarShellRef = useRef<HTMLDivElement | null>(null);
  const toolbarInnerRef = useRef<HTMLDivElement | null>(null);
  const previewShellRef = useRef<HTMLElement | null>(null);
  const tagPanelShellRef = useRef<HTMLElement | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mobileTagSheetOpen, setMobileTagSheetOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean | null>(null);
  const [recentSectionsCollapsed, setRecentSectionsCollapsed] = useState(false);
  const effectiveViewMode = viewMode;
  const desktopDefaultsAppliedRef = useRef(false);

  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : null;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  const { recentDrafts, recentInterestTags } = useRecentMaps({
    locale,
    listFields: LIST_FIELDS,
    toDraft,
  });

  useEffect(() => {
    if (isMobileViewport === null || isMobileViewport || desktopDefaultsAppliedRef.current) return;
    desktopDefaultsAppliedRef.current = true;
    setViewMode("card");
    setPreviewOpen(false);
  }, [isMobileViewport]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOpenDetail = (item: MapDraft) => {
    const nextUrl = locale ? `/${locale}/maps/${item.id}` : `/maps/${item.id}`;
    router.push(nextUrl);
  };

  const {
    query,
    page,
    setPage,
    sort,
    filtersOpen,
    setFiltersOpen,
    datePreset,
    setDatePreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    statusFilters,
    setStatusFilters,
    sourceFilters,
    setSourceFilters,
    dateRange,
    dateLabel,
    statusSummary,
    sourceSummary,
    toggleArrayValue,
    onQueryChange,
    onClearQuery,
    onSortChange,
    onResetFilters,
  } = useMapsListControls({
    statusLabels: STATUS_LABELS,
    sourceLabels: SOURCE_LABELS,
  });

  const {
    tagOrganizeMode,
    setTagOrganizeMode,
    tagFilters,
    setTagFilters,
    tagOptions,
    tagsLoading,
    tagListQuery,
    setTagListQuery,
    tagSort,
    setTagSort,
    tagDeleteTarget,
    setTagDeleteTarget,
    tagDeleteOpen,
    setTagDeleteOpen,
    tagDeleteSubmitting,
    tagEditOpen,
    setTagEditOpen,
    tagEditDraft,
    tagEditSubmitting,
    tagMergeOpen,
    setTagMergeOpen,
    selectedTagNames,
    setSelectedTagNames,
    mergedTagOptions,
    effectiveTagFilters,
    includesNoTagFilter,
    isTagOrganizeActive,
    toggleSelectedTag,
    handleTagDelete,
    handleTagMerge,
    openTagEditor,
    handleTagEditSave,
  } = useMapTags({
    locale,
    filtersOpen,
    mobileTagSheetOpen,
    dateRange,
    statusFilters,
    sourceFilters,
    updateDrafts: (updater) => setDrafts(updater),
    setPage,
    noTagFilter: NO_TAG_FILTER,
  });

  const {
    drafts,
    setDrafts,
    totalCount,
    loading,
    error,
  } = useMapsListQuery({
    listFields: LIST_FIELDS,
    page,
    pageSize: PAGE_SIZE,
    query,
    isTagOrganizeActive,
    sort,
    includesNoTagFilter,
    effectiveTagFilters,
    dateRange,
    statusFilters,
    sourceFilters,
    locale,
    toDraft,
  });

  const {
    selectionMode,
    setSelectionMode,
    selectedMapIds,
    clearSelection,
    toggleSelectedMap,
    mergeDialogOpen,
    setMergeDialogOpen,
    mergeRootTitle,
    setMergeRootTitle,
    mergeOrderIds,
    mergeOrderDrafts,
    mergeSubmitting,
    mergeReady,
    handleMergeDragEnd,
    handleMergeSubmit,
  } = useMapSelectionMerge({
    drafts,
    onMerged: (mergedId) => {
      const nextUrl = locale ? `/${locale}/maps/${mergedId}` : `/maps/${mergedId}`;
      router.push(nextUrl);
    },
  });

  const {
    confirmOpen,
    setConfirmOpen,
    confirmBulkOpen,
    setConfirmBulkOpen,
    bulkDeleting,
    confirmSingleDelete,
    confirmBulkDelete,
  } = useMapDeletion({
    updateDrafts: setDrafts,
    onAfterBulkDelete: clearSelection,
  });

  const {
    selectedId,
    selectedDraft,
    previewStatus,
    previewData,
    mobilePreviewOpen,
    setMobilePreviewOpen,
    handleItemSelect,
  } = useMapPreview({
    drafts,
    previewOpen,
  });

  useEffect(() => {
    if (isMobileViewport !== true) return;
    if (previewOpen) setPreviewOpen(false);
    if (mobilePreviewOpen) setMobilePreviewOpen(false);
  }, [
    isMobileViewport,
    mobilePreviewOpen,
    previewOpen,
    setMobilePreviewOpen,
  ]);

  const { pinned: previewPinned, metrics: previewMetrics } = usePinnedPanel({
    shellRef: previewShellRef,
    enabled: Boolean(previewOpen && !tagOrganizeMode && !isMobileViewport),
    topOffset: 128,
    refreshKey: selectedId,
  });

  const { pinned: tagPanelPinned, metrics: tagPanelMetrics } = usePinnedPanel({
    shellRef: tagPanelShellRef,
    enabled: Boolean(tagOrganizeMode && !isMobileViewport),
    topOffset: 132,
  });

  const { pinned: toolbarPinned, metrics: toolbarMetrics } = usePinnedToolbar({
    sectionRef: listSectionRef,
    shellRef: toolbarShellRef,
    innerRef: toolbarInnerRef,
    enabled: true,
    threshold: 65,
    refreshKey: [
      isMobileViewport,
      previewOpen,
      query,
      page,
      totalCount,
      loading,
      filtersOpen,
      selectionMode,
      tagOrganizeMode,
      viewMode,
    ].join("|"),
  });

  const isSearching = !isTagOrganizeActive && query.trim().length > 0;
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
  const hasFilteredDrafts = drafts.length > 0;
  const hasResults = totalCount > 0;
  const isInitialLoading = loading && drafts.length === 0;
  const isRefreshing = loading && drafts.length > 0;
  const tagSummary =
    !tagOrganizeMode && effectiveTagFilters.length > 0
      ? effectiveTagFilters.join(", ")
      : null;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, setPage, totalPages]);

  const previewEmptyMessage = loading
    ? "목록을 불러오는 중이에요."
    : !hasDrafts && !isSearching
    ? datePreset === "all"
      ? "아직 생성한 구조맵이 없어요."
      : "선택한 기간에 생성된 구조맵이 없어요."
    : !hasResults && isSearching
    ? "검색 결과가 없어요."
    : "좌측에서 맵을 선택해 주세요.";
  const showRecentSections =
    !error &&
    !isTagOrganizeActive &&
    !selectionMode &&
    !previewOpen &&
    page === 1 &&
    (hasDrafts || recentDrafts.length > 0 || recentInterestTags.length > 0);

  const recentSections = showRecentSections ? (
    <MapsRecentSections
      collapsed={recentSectionsCollapsed}
      onToggleCollapsed={setRecentSectionsCollapsed}
      recentDrafts={recentDrafts}
      recentInterestTags={recentInterestTags}
      getDisplayTitle={getMapListDisplayTitle}
      onOpenDetail={handleOpenDetail}
      onSelectInterestTag={(tagName) => {
        setTagFilters([tagName]);
        setSelectedTagNames([tagName]);
        setTagOrganizeMode(false);
        setPage(1);
      }}
    />
  ) : null;

  return (
    <main className="min-h-[70vh] bg-neutral-50 px-6 pt-24 pb-12 dark:bg-[#07111f]">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              나의 맵
            </h1>
          </div>
        </div>

        {recentSections}

        <div
          className={`${recentSectionsCollapsed ? "-mt-1" : "mt-4"} grid gap-6 ${
            isTagOrganizeActive
              ? "lg:grid-cols-[minmax(0,0.32fr)_minmax(0,0.68fr)]"
              : previewOpen
              ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
              : "lg:grid-cols-[minmax(0,1fr)]"
          } lg:min-h-[calc(100vh-160px)]`}
        >
          {tagOrganizeMode && !isMobileViewport && (
            <section
              ref={tagPanelShellRef}
              className="relative"
              style={{ minHeight: tagPanelMetrics.height || undefined }}
            >
              <div
                style={{
                  position: tagPanelPinned ? "fixed" : "absolute",
                  top: tagPanelPinned ? 125 : undefined,
                  bottom: tagPanelPinned ? undefined : 0,
                  left: tagPanelPinned ? tagPanelMetrics.left : 0,
                  width: tagPanelPinned ? tagPanelMetrics.width : "100%",
                  height: tagPanelMetrics.height || undefined,
                  zIndex: 20,
                }}
              >
                <TagPanel
                  tagListQuery={tagListQuery}
                  onTagListQueryChange={setTagListQuery}
                  tagsLoading={tagsLoading}
                  tagOptions={mergedTagOptions}
                  tagSort={tagSort}
                  onTagSortChange={setTagSort}
                  onDeleteTag={(tag) => {
                    setTagDeleteTarget(tag);
                    setTagDeleteOpen(true);
                  }}
                  selectedTags={selectedTagNames}
                  onToggleSelect={toggleSelectedTag}
                  onOpenMerge={() => setTagMergeOpen(true)}
                  containerClassName="block h-full"
                  panelClassName="flex h-full flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white p-4 shadow-sm dark:border-blue-500/20 dark:bg-white/[0.04]"
                  listClassName="mt-3 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1"
                  headerAccessory={
                    <button
                      type="button"
                      onClick={() => {
                        setTagOrganizeMode(false);
                        setMobileTagSheetOpen(false);
                      }}
                      className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-neutral-600 shadow-sm hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/80 dark:hover:bg-white/10"
                    >
                      종료
                    </button>
                  }
                />
              </div>
            </section>
          )}
          <section
            ref={listSectionRef}
            className={`min-w-0 lg:self-start ${
              previewOpen ? "lg:pr-4 lg:[scrollbar-gutter:stable]" : ""
            }`}
          >
            <div
              ref={toolbarShellRef}
              className={`${isTagOrganizeActive ? "mb-1" : "mb-3"} flex justify-end`}
              style={toolbarPinned ? { height: toolbarMetrics.height } : undefined}
            >
              <div
                ref={toolbarInnerRef}
                className="w-full rounded-2xl bg-neutral-50/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-50/80 dark:bg-[#07111f]/95 dark:supports-[backdrop-filter]:bg-[#07111f]/80"
                style={
                  toolbarPinned
                    ? {
                        position: "fixed",
                        top: 65,
                        left: toolbarMetrics.left,
                        width: toolbarMetrics.width,
                        zIndex: filtersOpen ? 120 : 40,
                      }
                    : undefined
                }
              >
                <MapListToolbar
                  query={query}
                  onQueryChange={onQueryChange}
                  onClearQuery={onClearQuery}
                  selectionMode={selectionMode}
                  selectedCount={selectedMapIds.length}
                  onOpenMerge={() => setMergeDialogOpen(true)}
                  onOpenBulkDelete={() => setConfirmBulkOpen(true)}
                  onCancelSelection={clearSelection}
                  bulkDeleting={bulkDeleting}
                  statusSummary={statusSummary}
                  sourceSummary={sourceSummary}
                  tagSummary={tagSummary}
                  dateLabel={dateLabel}
                  datePreset={datePreset}
                  previewOpen={previewOpen}
                  onTogglePreview={() => {
                    if (isMobileViewport) return;
                    const next = !previewOpen;
                    if (next && selectionMode) {
                      clearSelection();
                      toast.message("프리뷰 모드로 전환되어 선택 모드가 꺼졌어요.");
                    }
                    if (next && isTagOrganizeActive) {
                      setTagOrganizeMode(false);
                      setMobileTagSheetOpen(false);
                      toast.message("프리뷰를 위해 태그 정리 모드를 껐어요.");
                    }
                    setPreviewOpen(next);
                    setMobilePreviewOpen(false);
                  }}
                  tagOrganizeMode={isTagOrganizeActive}
                  onToggleTagOrganize={() => {
                    if (isMobileViewport) {
                      const next = !isTagOrganizeActive;
                      if (previewOpen) {
                        setPreviewOpen(false);
                        setMobilePreviewOpen(false);
                      }
                      setTagOrganizeMode(next);
                      setMobileTagSheetOpen(next);
                      return;
                    }
                    const next = !tagOrganizeMode;
                    if (next && previewOpen) {
                      setPreviewOpen(false);
                      setMobilePreviewOpen(false);
                      toast.message("태그 정리 모드로 전환되어 프리뷰가 꺼졌어요.");
                    }
                    if (next && selectionMode) {
                      clearSelection();
                      toast.message("태그 정리 모드로 전환되어 선택 모드가 꺼졌어요.");
                    }
                    setMobileTagSheetOpen(next);
                    setTagOrganizeMode(next);
                  }}
                  onToggleSelection={() => {
                    const next = !selectionMode;
                    if (!next) {
                      clearSelection();
                      return;
                    }
                    if (previewOpen) {
                      setPreviewOpen(false);
                      setMobilePreviewOpen(false);
                      toast.message("선택 모드로 전환되어 프리뷰가 꺼졌어요.");
                    }
                    if (isTagOrganizeActive) {
                      setTagOrganizeMode(false);
                      setMobileTagSheetOpen(false);
                      toast.message("태그 정리 모드를 종료하고 선택 모드로 전환했어요.");
                    }
                    setSelectionMode(true);
                  }}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  hidePreviewToggle={Boolean(isMobileViewport)}
                  sort={sort}
                  onSortChange={onSortChange}
                  filtersOpen={filtersOpen}
                  onToggleFilters={() => setFiltersOpen((prev) => !prev)}
                  showResetFilters={
                    statusFilters.length > 0 ||
                    sourceFilters.length > 0 ||
                    tagFilters.length > 0 ||
                    datePreset !== "30d"
                  }
                  onResetFilters={() => {
                    onResetFilters();
                    setTagFilters([]);
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
                      showTagFilters={!isTagOrganizeActive}
                      onClose={() => setFiltersOpen(false)}
                    />
                  }
                />
              </div>
            </div>

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
              isTagOrganizeActive &&
              selectedTagNames.length > 0 &&
              !hasFilteredDrafts && (
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                  선택한 태그가 붙은 맵이 없어요.
                </div>
              )}

            {isInitialLoading && (
              <div className={isTagOrganizeActive ? "-mt-2" : ""}>
                {effectiveViewMode === "card" ? (
                  <MapCardListSkeleton />
                ) : (
                  <MapTableListSkeleton />
                )}
              </div>
            )}

            {!error && hasResults && !isInitialLoading && (
              <div
                className={`${
                  isRefreshing ? "opacity-75 transition-opacity" : "transition-opacity"
                } ${isTagOrganizeActive ? "-mt-2" : ""}`}
              >
                {effectiveViewMode === "card" ? (
                  <MapCardList
                    drafts={drafts}
                    selectedId={selectedId}
                    previewOpen={previewOpen}
                    selectionMode={selectionMode}
                    tagOrganizeMode={isTagOrganizeActive}
                    compactLayout={previewOpen || isTagOrganizeActive}
                    selectedMapIds={selectedMapIds}
                    onSelect={(item) =>
                      handleItemSelect(item, selectionMode, toggleSelectedMap)
                    }
                    onToggleSelect={toggleSelectedMap}
                    onEditTags={openTagEditor}
                    onOpenDetail={handleOpenDetail}
                    showOpenDetail
                  />
                ) : (
                  <MapTableList
                    drafts={drafts}
                    selectedId={selectedId}
                    previewOpen={previewOpen}
                    selectionMode={selectionMode}
                    tagOrganizeMode={isTagOrganizeActive}
                    selectedMapIds={selectedMapIds}
                    onSelect={(item) =>
                      handleItemSelect(item, selectionMode, toggleSelectedMap)
                    }
                    onToggleSelect={toggleSelectedMap}
                    onEditTags={openTagEditor}
                    showEditTags={isTagOrganizeActive}
                    onOpenDetail={handleOpenDetail}
                    showOpenDetail
                    statusLabels={STATUS_LABELS}
                    sourceLabels={SOURCE_LABELS}
                  />
                )}
              </div>
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

          {previewOpen && !isTagOrganizeActive &&
            (loading ? (
              <MapPreviewSkeleton />
            ) : (
              <section
                ref={previewShellRef}
                className="relative hidden lg:block"
                style={{ minHeight: previewMetrics.height || undefined }}
              >
                <div
                  style={{
                    position: previewPinned ? "fixed" : "absolute",
                    top: previewPinned ? 128 : undefined,
                    bottom: previewPinned ? undefined : 0,
                    left: previewPinned ? previewMetrics.left : 0,
                    width: previewPinned ? previewMetrics.width : "100%",
                    zIndex: 20,
                  }}
                >
                  <MapPreviewPanel
                    draft={selectedDraft}
                    previewData={previewData}
                    previewStatus={loading ? "loading" : previewStatus}
                    emptyMessage={previewEmptyMessage}
                    isOpen={previewOpen}
                    onOpen={() => setPreviewOpen(true)}
                    onClose={() => setPreviewOpen(false)}
                  />
                </div>
              </section>
            ))}
        </div>
      </div>

      <MobileTagSheet
        open={mobileTagSheetOpen}
        tagOrganizeMode={tagOrganizeMode}
        tagListQuery={tagListQuery}
        onTagListQueryChange={setTagListQuery}
        tagsLoading={tagsLoading}
        tagOptions={mergedTagOptions}
        tagSort={tagSort}
        onTagSortChange={setTagSort}
        selectedTags={selectedTagNames}
        onToggleSelect={toggleSelectedTag}
        onDeleteTag={(tag) => {
          setTagDeleteTarget(tag);
          setTagDeleteOpen(true);
        }}
        onOpenMerge={() => setTagMergeOpen(true)}
        onCloseSheet={() => setMobileTagSheetOpen(false)}
        onReopen={() => {
          setMobileTagSheetOpen(true);
          setTagOrganizeMode(true);
        }}
      />

      {/* Mobile bottom sheet preview */}
      <div className={`lg:hidden ${previewOpen && !isMobileViewport ? "" : "hidden"}`}>
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
        onConfirm={confirmSingleDelete}
        title="구조맵을 삭제할까요?"
        description="삭제하면 복구할 수 없어요. 계속 진행할까요?"
        actionLabel="삭제"
      />

      <ConfirmDialog
        open={confirmBulkOpen}
        onOpenChange={setConfirmBulkOpen}
        onConfirm={() => confirmBulkDelete([...selectedMapIds])}
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
        selectedTags={selectedTagNames.filter((tag) => tag !== NO_TAG_FILTER)}
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
