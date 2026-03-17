"use client";

import { Icon } from "@iconify/react";
import type { ReactNode } from "react";
import SelectionActionBar from "@/components/maps/SelectionActionBar";

type SortValue = "created_desc" | "created_asc" | "updated_desc" | "title_asc";
type ViewMode = "card" | "table";

type MapListToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onClearQuery: () => void;
  selectionMode: boolean;
  selectedCount: number;
  onOpenMerge: () => void;
  onOpenBulkDelete: () => void;
  onCancelSelection: () => void;
  bulkDeleting: boolean;
  statusSummary: string | null;
  sourceSummary: string | null;
  tagSummary: string | null;
  dateLabel: string;
  datePreset: string;
  previewOpen: boolean;
  onTogglePreview: () => void;
  tagOrganizeMode: boolean;
  onToggleTagOrganize: () => void;
  onToggleSelection: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sort: SortValue;
  onSortChange: (value: SortValue) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  showResetFilters: boolean;
  onResetFilters: () => void;
  filterPopover?: ReactNode;
};

export default function MapListToolbar({
  query,
  onQueryChange,
  onClearQuery,
  selectionMode,
  selectedCount,
  onOpenMerge,
  onOpenBulkDelete,
  onCancelSelection,
  bulkDeleting,
  statusSummary,
  sourceSummary,
  tagSummary,
  dateLabel,
  datePreset,
  previewOpen,
  onTogglePreview,
  tagOrganizeMode,
  onToggleTagOrganize,
  onToggleSelection,
  viewMode,
  onViewModeChange,
  sort,
  onSortChange,
  filtersOpen,
  onToggleFilters,
  showResetFilters,
  onResetFilters,
  filterPopover,
}: MapListToolbarProps) {
  return (
    <div className="md:sticky md:top-0 md:z-20 md:-mx-2 md:px-2 md:pb-3 md:pt-0 md:backdrop-blur md:supports-[backdrop-filter]:bg-white/75 dark:md:supports-[backdrop-filter]:bg-[#0b1220]/75">
      {!tagOrganizeMode && (
        <div className="relative">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-white/40"
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="맵 제목이나 태그로 검색해 보세요"
            className="
              w-full rounded-2xl border border-neutral-400 bg-white shadow-sm
              pl-9 pr-10 py-2 text-sm text-neutral-900
              placeholder:text-neutral-400
              focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200/70
              dark:border-white/12 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/45
              dark:focus:border-white dark:focus:ring-white/20
            "
          />
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={onClearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="검색어 지우기"
            >
              <Icon icon="mdi:close-circle" className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {selectionMode && (
        <SelectionActionBar
          selectedCount={selectedCount}
          onOpenMerge={onOpenMerge}
          onOpenBulkDelete={onOpenBulkDelete}
          onCancelSelection={onCancelSelection}
          bulkDeleting={bulkDeleting}
        />
      )}

      <div
        className={`mt-1 flex flex-col gap-[2px] rounded-2xl border border-neutral-200 bg-neutral-50/70 px-3 pt-0.5 pb-1 md:mt-2 md:flex-row md:items-center md:justify-between dark:border-white/10 dark:bg-white/[0.04] md:py-2 md:gap-2 ${
          filtersOpen ? "md:relative md:z-[60]" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-white/60">
          {statusSummary && <span>상태 {statusSummary}</span>}
          {sourceSummary && <span>소스 {sourceSummary}</span>}
          {tagSummary && <span>태그 {tagSummary}</span>}
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-2">
          <div className="flex w-full flex-col items-stretch gap-1.5 md:relative md:z-[60] md:w-auto md:flex-row md:flex-nowrap md:items-center md:justify-end md:gap-2">
            <span className="text-[11px] font-semibold text-neutral-700 dark:text-white/80 md:shrink-0">
              {datePreset === "custom"
                ? dateLabel
                : dateLabel.replace("지난", "최근")}
            </span>
            <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
            <button
              type="button"
              onClick={onTogglePreview}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-neutral-600 bg-neutral-700 px-2 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-neutral-600 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 md:px-3 md:py-1.5 md:text-xs"
            >
              <Icon icon="mdi:eye-outline" className="h-3.5 w-3.5" />
              {previewOpen ? "프리뷰 끄기" : "프리뷰 켜기"}
            </button>
            <button
              type="button"
              onClick={onToggleTagOrganize}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-neutral-600 bg-neutral-700 px-2 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-neutral-600 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 md:px-3 md:py-1.5 md:text-xs"
            >
              <Icon icon="mdi:tag-outline" className="h-3.5 w-3.5" />
              {tagOrganizeMode ? "정리 모드 종료" : "태그 정리 모드"}
            </button>
            <button
              type="button"
              onClick={onToggleSelection}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-neutral-600 bg-neutral-700 px-2 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-neutral-600 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 md:px-3 md:py-1.5 md:text-xs"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-3.5 w-3.5"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="3"
                  ry="3"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <path
                  d="M7 12.5l3 3 7-7"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {selectionMode ? "선택 종료" : "선택"}
            </button>
            </div>
          </div>

          <div className="relative flex w-full items-center gap-2 md:w-auto md:flex-nowrap">
            <div className="inline-flex min-w-0 shrink-0 rounded-full border border-neutral-400 bg-white text-[11px] font-semibold text-neutral-700 shadow-sm overflow-hidden dark:border-white/20 dark:bg-white/[0.06] dark:text-white/85 md:text-xs">
              <button
                type="button"
                onClick={() => onViewModeChange("card")}
                className={`px-2 py-1 md:px-3 md:py-1.5 ${
                  viewMode === "card"
                    ? "bg-neutral-700 text-white"
                    : "hover:bg-neutral-50 dark:hover:bg-white/10"
                }`}
              >
                카드
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("table")}
                className={`px-2 py-1 md:px-3 md:py-1.5 ${
                  viewMode === "table"
                    ? "bg-neutral-700 text-white"
                    : "hover:bg-neutral-50 dark:hover:bg-white/10"
                }`}
              >
                테이블
              </button>
            </div>
            <label className="sr-only" htmlFor="maps-sort">
              정렬
            </label>
            <select
              id="maps-sort"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortValue)}
              className="min-w-0 flex-1 rounded-full border border-neutral-400 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10 md:flex-none md:px-3 md:py-1.5 md:text-xs"
            >
              <option value="created_desc">최신 생성순</option>
              <option value="created_asc">오래된 생성순</option>
              <option value="updated_desc">최근 수정순</option>
              <option value="title_asc">제목순</option>
            </select>
            <button
              type="button"
              onClick={onToggleFilters}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-600 bg-neutral-700 text-white shadow-sm hover:bg-neutral-600 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 md:h-8 md:w-8"
              aria-label={filtersOpen ? "필터 닫기" : "필터 열기"}
            >
              <Icon icon="mdi:filter-variant" className="h-4 w-4" />
            </button>
            {showResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="rounded-full border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 shadow-sm hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20 md:px-3 md:py-1.5 md:text-xs"
              >
                필터 초기화
              </button>
            )}
            {filtersOpen && filterPopover}
          </div>
        </div>
      </div>
    </div>
  );
}
