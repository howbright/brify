"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
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
import MapNotesTab from "@/components/maps/MapNotesTab";
import MapTermsTab from "@/components/maps/MapTermsTab";
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
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";
import type { Database } from "@/app/types/database.types";
import { useRef } from "react";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];
type SourceType = "youtube" | "website" | "file" | "manual";
type MapsPageTab = "maps" | "notes" | "terms";

const LIST_FIELDS =
  "id,created_at,updated_at,title,short_title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged,notes_count,terms_count";
const PAGE_SIZE = 20;
const NO_TAG_FILTER = "__NO_TAG__";

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
    notesCount: typeof row.notes_count === "number" ? row.notes_count : 0,
    termsCount: typeof row.terms_count === "number" ? row.terms_count : 0,
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
            <th className="px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">
              <div className="h-3 w-10 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
            </th>
            <th className="w-[64px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">
              <div className="h-3 w-8 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
            </th>
            <th className="w-[64px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">
              <div className="h-3 w-8 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
            </th>
            <th className="w-[120px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">
              <div className="h-3 w-8 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
            </th>
            <th className="w-[110px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">
              <div className="h-3 w-10 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
            </th>
            <th className="w-[110px] px-2 py-1.5">
              <div className="h-3 w-10 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
            </th>
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
  const tPage = useTranslations("MapsPage");
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
        aria-label={tPage("mergeDialog.dragReorderAria")}
        {...attributes}
        {...listeners}
      >
        <Icon icon="mdi:drag" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}


export default function MapsPage() {
  const tPage = useTranslations("MapsPage");
  const tCommon = useTranslations("MapsCommon");
  const listSectionRef = useRef<HTMLElement | null>(null);
  const toolbarShellRef = useRef<HTMLDivElement | null>(null);
  const toolbarInnerRef = useRef<HTMLDivElement | null>(null);
  const previewShellRef = useRef<HTMLElement | null>(null);
  const tagPanelShellRef = useRef<HTMLElement | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [activeTab, setActiveTab] = useState<MapsPageTab>("maps");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [openingDetailId, setOpeningDetailId] = useState<string | null>(null);
  const [mobileTagSheetOpen, setMobileTagSheetOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean | null>(null);
  const [recentSectionsCollapsed, setRecentSectionsCollapsed] = useState(false);
  const effectiveViewMode = viewMode;
  const desktopDefaultsAppliedRef = useRef(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : null;
  const statusLabels = useMemo<Record<MapJobStatus, string>>(
    () => ({
      idle: tCommon("status.idle"),
      queued: tCommon("status.queued"),
      processing: tCommon("status.processing"),
      done: tCommon("status.done"),
      failed: tCommon("status.failed"),
    }),
    [tCommon]
  );
  const sourceLabels = useMemo<Record<SourceType, string>>(
    () => ({
      youtube: tCommon("source.youtube"),
      website: tCommon("source.website"),
      file: tCommon("source.file"),
      manual: tCommon("source.manual"),
    }),
    [tCommon]
  );
  const contentLabels = useMemo(
    () => ({
      notes: tCommon("content.notes"),
      terms: tCommon("content.terms"),
    }),
    [tCommon]
  );

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
    if (item.status !== "done") {
      const blockedMessage =
        locale === "ko"
          ? item.status === "failed"
            ? "실패한 맵은 열 수 없어요."
            : "아직 생성 중인 맵이라 열 수 없어요."
          : item.status === "failed"
          ? "Failed maps can't be opened."
          : "This map is still being generated and can't be opened yet.";
      toast.message(blockedMessage);
      return;
    }
    const nextUrl = locale ? `/${locale}/maps/${item.id}` : `/maps/${item.id}`;
    setOpeningDetailId(item.id);
    router.push(nextUrl);
  };

  const handlePrefetchDetail = (item: MapDraft) => {
    if (item.status !== "done") return;
    const nextUrl = locale ? `/${locale}/maps/${item.id}` : `/maps/${item.id}`;
    router.prefetch(nextUrl);
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
    contentFilters,
    setContentFilters,
    dateRange,
    dateLabel,
    hasActiveDateFilter,
    statusSummary,
    sourceSummary,
    contentSummary,
    toggleArrayValue,
    onQueryChange,
    onClearQuery,
    onSortChange,
    onResetFilters,
    onResetDateFilter,
  } = useMapsListControls({
    statusLabels,
    sourceLabels,
    contentLabels,
    datePresetLabels: {
      today: tCommon("datePreset.today"),
      "7d": tCommon("datePreset.7d"),
      "30d": tCommon("datePreset.30d"),
      "90d": tCommon("datePreset.90d"),
      "1y": tCommon("datePreset.1y"),
      month: tCommon("datePreset.month"),
      all: tCommon("datePreset.all"),
    },
    customDateEmptyLabel: tCommon("datePreset.customEmpty"),
    customDateFromLabelSuffix: tCommon("datePreset.after"),
    customDateToLabelSuffix: tCommon("datePreset.before"),
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
    contentFilters,
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
    refresh,
  } = useMapsListQuery({
    enabled: activeTab === "maps",
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
    contentFilters,
    locale,
    toDraft,
  });

  const isRefreshingList = loading && drafts.length > 0;

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
    contentFilters.length > 0 ||
    tagFilters.length > 0 ||
    hasActiveDateFilter;
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
    ? tPage("previewEmpty.loading")
    : !hasDrafts && !isSearching
    ? datePreset === "all"
      ? tPage("previewEmpty.noMaps")
      : tPage("previewEmpty.noMapsInRange")
    : !hasResults && isSearching
    ? tPage("previewEmpty.noResults")
    : tPage("previewEmpty.selectFromList");
  const showRecentSections =
    activeTab === "maps" &&
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
      onPrefetchDetail={handlePrefetchDetail}
      openingDetailId={openingDetailId}
      onSelectInterestTag={(tagName) => {
        setTagFilters([tagName]);
        setSelectedTagNames([tagName]);
        setTagOrganizeMode(false);
        setPage(1);
      }}
    />
  ) : null;

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const nextTab: MapsPageTab =
      tabParam === "notes" || tabParam === "terms" ? tabParam : "maps";
    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [activeTab, searchParams]);

  const handleChangeTab = (nextTab: MapsPageTab) => {
    setActiveTab(nextTab);
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (nextTab === "maps") {
      nextSearchParams.delete("tab");
    } else {
      nextSearchParams.set("tab", nextTab);
    }
    const nextQuery = nextSearchParams.toString();
    if (typeof window !== "undefined") {
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      window.history.pushState({}, "", nextUrl);
    }
    setFiltersOpen(false);
    if (nextTab !== "maps") {
      setPreviewOpen(false);
      setMobilePreviewOpen(false);
      setSelectionMode(false);
      clearSelection();
      setTagOrganizeMode(false);
      setMobileTagSheetOpen(false);
    }
  };

  return (
    <main className="min-h-[70vh] bg-neutral-50 px-6 pt-22 pb-12 dark:bg-[#07111f]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {tPage("title")}
            </h1>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(
            [
              { id: "maps", label: tPage("tabs.maps") },
              { id: "notes", label: tPage("tabs.notes") },
              { id: "terms", label: tPage("tabs.terms") },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleChangeTab(tab.id)}
                aria-pressed={isActive}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[13px] font-semibold transition ${
                  isActive
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.04] dark:text-white/72 dark:hover:bg-white/[0.08]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "maps" ? (
          <>
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
                  top: tagPanelPinned ? 128 : undefined,
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
                      {tPage("tagOrganizeExit")}
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
                className="w-full rounded-2xl bg-neutral-50/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-50/80 dark:border-0 dark:bg-transparent dark:shadow-none dark:supports-[backdrop-filter]:bg-transparent"
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
                  onRefresh={refresh}
                  refreshing={isRefreshingList}
                  selectionMode={selectionMode}
                  selectedCount={selectedMapIds.length}
                  onOpenMerge={() => setMergeDialogOpen(true)}
                  onOpenBulkDelete={() => setConfirmBulkOpen(true)}
                  onCancelSelection={clearSelection}
                  bulkDeleting={bulkDeleting}
                  statusSummary={statusSummary}
                  sourceSummary={sourceSummary}
                  contentSummary={contentSummary}
                  tagSummary={tagSummary}
                  dateLabel={dateLabel}
                  datePreset={datePreset}
                  previewOpen={previewOpen}
                  onTogglePreview={() => {
                    if (isMobileViewport) return;
                    const next = !previewOpen;
                    if (next && selectionMode) {
                      clearSelection();
                      toast.message(tPage("toast.previewTurnsOffSelection"));
                    }
                    if (next && isTagOrganizeActive) {
                      setTagOrganizeMode(false);
                      setMobileTagSheetOpen(false);
                      toast.message(tPage("toast.previewTurnsOffTagOrganize"));
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
                      toast.message(tPage("toast.tagOrganizeTurnsOffPreview"));
                    }
                    if (next && selectionMode) {
                      clearSelection();
                      toast.message(tPage("toast.tagOrganizeTurnsOffSelection"));
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
                      toast.message(tPage("toast.selectionTurnsOffPreview"));
                    }
                    if (isTagOrganizeActive) {
                      setTagOrganizeMode(false);
                      setMobileTagSheetOpen(false);
                      toast.message(tPage("toast.selectionTurnsOffTagOrganize"));
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
                    contentFilters.length > 0 ||
                    tagFilters.length > 0 ||
                    hasActiveDateFilter
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
                        if (value && customTo && value > customTo) {
                          setCustomTo(value);
                        }
                        setDatePreset("custom");
                        setPage(1);
                      }}
                      onCustomToChange={(value) => {
                        setCustomTo(value);
                        if (value && customFrom && value < customFrom) {
                          setCustomFrom(value);
                        }
                        setDatePreset("custom");
                        setPage(1);
                      }}
                      onResetDateFilter={onResetDateFilter}
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
                      contentFilters={contentFilters}
                      onToggleContent={(value) => {
                        toggleArrayValue(value, setContentFilters);
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
                  ? tPage("empty.noMaps")
                  : tPage("empty.noMapsForFilters")}
              </div>
            )}

            {!loading && !error && isSearching && !hasResults && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                {tPage("empty.noSearchResults")}
              </div>
            )}

            {!loading &&
              !error &&
              isTagOrganizeActive &&
              selectedTagNames.length > 0 &&
              !hasFilteredDrafts && (
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                  {tPage("empty.noMapsForSelectedTags")}
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
                    onPrefetchDetail={handlePrefetchDetail}
                    openingDetailId={openingDetailId}
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
                    onPrefetchDetail={handlePrefetchDetail}
                    openingDetailId={openingDetailId}
                    showOpenDetail
                    statusLabels={statusLabels}
                    sourceLabels={sourceLabels}
                  />
                )}
              </div>
            )}

            {!loading && !error && hasResults && (
              <div className="sticky bottom-0 z-10 mt-4 flex flex-col items-end gap-2">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-neutral-700 bg-neutral-800 px-3 py-2 shadow-md">
                  <div className="text-xs font-semibold text-white/90">
                    {tPage("pagination.totalCount", { count: totalCount })}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="rounded-full px-2 py-1 hover:bg-white/15 disabled:opacity-40"
                    >
                      {tPage("pagination.prev")}
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
                      {tPage("pagination.next")}
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
          </>
        ) : activeTab === "notes" ? (
          <MapNotesTab />
        ) : activeTab === "terms" ? (
          <MapTermsTab />
        ) : (
          <section className="mt-2 rounded-3xl border border-neutral-200 bg-white px-6 py-10 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[12px] font-semibold text-neutral-600 dark:border-white/12 dark:bg-white/[0.05] dark:text-white/72">
                {activeTab === "notes" ? tPage("tabs.notes") : tPage("tabs.terms")}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white/94">
                {activeTab === "notes"
                  ? tPage("comingSoon.notesTitle")
                  : tPage("comingSoon.termsTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-white/64">
                {activeTab === "notes"
                  ? tPage("comingSoon.notesDescription")
                  : tPage("comingSoon.termsDescription")}
              </p>
            </div>
          </section>
        )}
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
        title={tPage("dialogs.deleteMap.title")}
        description={tPage("dialogs.deleteMap.description")}
        actionLabel={tPage("dialogs.deleteMap.action")}
        cancelLabel={tCommon("selectionBar.cancel")}
      />

      <ConfirmDialog
        open={confirmBulkOpen}
        onOpenChange={setConfirmBulkOpen}
        onConfirm={() => confirmBulkDelete([...selectedMapIds])}
        title={tPage("dialogs.deleteSelected.title")}
        description={tPage("dialogs.deleteSelected.description")}
        actionLabel={tPage("dialogs.deleteSelected.action")}
        cancelLabel={tCommon("selectionBar.cancel")}
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
        title={tPage("dialogs.deleteTag.title")}
        description={
          tagDeleteTarget ? (
            <span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                #{tagDeleteTarget}
              </span>{" "}
              {tPage("dialogs.deleteTag.descriptionSuffix")}
            </span>
          ) : (
            tPage("dialogs.deleteTag.description")
          )
        }
        actionLabel={
          tagDeleteSubmitting
            ? tPage("dialogs.deleteTag.actionLoading")
            : tPage("dialogs.deleteTag.action")
        }
        cancelLabel={tCommon("selectionBar.cancel")}
      />

      <TagEditDialog
        open={tagEditOpen}
        onOpenChange={setTagEditOpen}
        draftTitle={tagEditDraft?.title ?? tPage("fallback.selectedMap")}
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
                    {tPage("mergeDialog.title")}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-white/60">
                    {tPage("mergeDialog.description")}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-neutral-800 dark:text-white">
                      {tPage("mergeDialog.rootTitle")}
                    </label>
                    <span className="text-xs font-semibold text-rose-600">{tPage("mergeDialog.required")}</span>
                  </div>
                  <input
                    value={mergeRootTitle}
                    onChange={(event) => setMergeRootTitle(event.target.value)}
                    placeholder={tPage("mergeDialog.placeholder")}
                    className={`w-full rounded-2xl border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/45 ${
                      mergeRootTitle.trim().length === 0
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200/60 dark:border-rose-400/40 dark:focus:border-rose-300 dark:focus:ring-rose-500/20"
                        : "border-neutral-300 focus:border-neutral-900 focus:ring-neutral-200/70 dark:border-white/15 dark:focus:border-white dark:focus:ring-white/20"
                    }`}
                  />
                  {mergeRootTitle.trim().length === 0 ? (
                    <p className="text-xs text-rose-600">
                      {tPage("mergeDialog.validation")}
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500 dark:text-white/60">
                      {tPage("mergeDialog.help")}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-white">
                      {tPage("mergeDialog.orderTitle")}
                    </h4>
                    <span className="text-xs text-neutral-500 dark:text-white/60">
                      {tPage("mergeDialog.orderCount", { count: mergeOrderDrafts.length })}
                    </span>
                  </div>
                  {mergeOrderDrafts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                      {tPage("mergeDialog.empty")}
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
                {tPage("close")}
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
                {mergeSubmitting ? tPage("mergeDialog.submitting") : tPage("mergeDialog.confirm")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
