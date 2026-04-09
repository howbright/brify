"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import SelectionActionBar from "@/components/maps/SelectionActionBar";

type SortValue = "created_desc" | "created_asc" | "updated_desc" | "title_asc";
type ViewMode = "card" | "table";

type MapListToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onClearQuery: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  selectionMode: boolean;
  selectedCount: number;
  onOpenMerge: () => void;
  onOpenBulkDelete: () => void;
  onCancelSelection: () => void;
  bulkDeleting: boolean;
  statusSummary: string | null;
  sourceSummary: string | null;
  contentSummary: string | null;
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
  hidePreviewToggle?: boolean;
  hideViewModeToggle?: boolean;
};

export default function MapListToolbar({
  query,
  onQueryChange,
  onClearQuery,
  onRefresh,
  refreshing,
  selectionMode,
  selectedCount,
  onOpenMerge,
  onOpenBulkDelete,
  onCancelSelection,
  bulkDeleting,
  statusSummary,
  sourceSummary,
  contentSummary,
  tagSummary,
  dateLabel,
  datePreset: _datePreset,
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
  hidePreviewToggle = false,
  hideViewModeToggle = false,
}: MapListToolbarProps) {
  const t = useTranslations("MapsCommon.toolbar");
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [filterAnchorRect, setFilterAnchorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!filtersOpen) return;

    const updateAnchor = () => {
      setFilterAnchorRect(filterButtonRef.current?.getBoundingClientRect() ?? null);
    };

    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [filtersOpen]);

  return (
    <div
      className={`md:sticky md:top-0 md:-mx-2 md:px-2 md:pt-0 md:supports-[backdrop-filter]:bg-transparent dark:md:supports-[backdrop-filter]:bg-transparent ${
        filtersOpen ? "md:z-[120]" : "md:z-20"
      }`}
    >
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
        className={`flex flex-col gap-1 ${
          tagOrganizeMode ? "mt-0 md:mt-0" : "mt-1 md:mt-1.5"
        } ${
          previewOpen
            ? "md:flex-col md:items-stretch md:gap-1.5"
            : "md:flex-row md:items-center md:gap-3"
        } ${
          filtersOpen ? "md:relative md:z-[60]" : ""
        }`}
      >
        {!tagOrganizeMode && (
          <div
            className={`relative ${
              previewOpen ? "md:w-full" : "md:min-w-0 md:flex-1"
            }`}
          >
            <Icon
              icon="mdi:magnify"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-900 dark:text-white"
            />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="
                w-full rounded-[18px] border border-slate-600 bg-white shadow-sm
                pl-8 pr-9 py-2 text-[14px] text-neutral-900
                placeholder:text-neutral-400
                focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300/70
                dark:border-sky-300/22 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.92),rgba(20,30,48,0.98))] dark:text-white dark:placeholder:text-white/45
                dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_28px_-20px_rgba(2,6,23,0.9)]
                dark:focus:border-sky-300/50 dark:focus:ring-sky-400/18
                md:py-1.5 md:text-[13px]
              "
            />
            {query.trim().length > 0 && (
              <button
                type="button"
                onClick={onClearQuery}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={t("clearSearch")}
              >
                <Icon icon="mdi:close-circle" className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        )}

        <div
          className={`rounded-[20px] border border-neutral-200/80 bg-white px-2.5 py-1.5 dark:border-white/12 dark:bg-[linear-gradient(180deg,rgba(16,24,39,0.9),rgba(12,19,32,0.96))] dark:shadow-[0_20px_40px_-30px_rgba(2,6,23,0.92)] md:px-3 md:py-1.5 ${
          previewOpen
            ? "md:w-full"
            : "md:w-auto md:min-w-fit md:max-w-none"
        } ${
          filtersOpen ? "md:relative md:z-[60]" : ""
        }`}
      >
        <div
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-neutral-600 dark:text-white/65 md:min-w-0 md:text-[10px] ${
            previewOpen ? "md:flex-wrap" : "md:flex-nowrap md:overflow-hidden"
          }`}
        >
          {statusSummary && <span>{t("summary.status", { value: statusSummary })}</span>}
          {sourceSummary && <span>{t("summary.source", { value: sourceSummary })}</span>}
          {contentSummary && <span>{t("summary.content", { value: contentSummary })}</span>}
          {tagSummary && <span>{t("summary.tag", { value: tagSummary })}</span>}
        </div>

        <div
          className={`flex flex-col gap-1.5 md:min-w-0 md:gap-1.5 ${
            previewOpen
              ? "md:flex-col md:items-stretch"
              : "md:flex-row md:flex-nowrap md:items-center md:justify-end"
          }`}
        >
          <div
            className={`flex w-full flex-wrap items-center justify-end gap-1 md:relative md:z-[60] ${
              previewOpen
                ? "md:w-full md:justify-between"
                : "md:w-auto md:flex-row md:flex-nowrap md:items-center md:justify-end md:gap-1.5"
            }`}
          >
            <span className="inline-flex shrink-0 items-center rounded-full border border-slate-300 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-700 dark:border-white/16 dark:bg-white/[0.08] dark:text-white/82 md:border-0 md:bg-transparent md:px-0 md:py-0 md:text-[10px]">
              {dateLabel}
            </span>
            <div
              className={`flex flex-1 flex-wrap items-center justify-end gap-1.5 ${
                previewOpen ? "md:justify-end" : "md:flex-none md:flex-nowrap"
              }`}
            >
            {!hidePreviewToggle && (
              <button
                type="button"
                onClick={onTogglePreview}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-neutral-600 dark:border-white/16 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14] md:min-h-7 md:px-3 md:py-1 md:text-[10px]"
              >
                <Icon icon="mdi:eye-outline" className="h-3.5 w-3.5" />
                {previewOpen ? t("previewOff") : t("previewOn")}
              </button>
            )}
            <button
              type="button"
              onClick={onToggleTagOrganize}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-neutral-600 dark:border-white/16 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14] md:min-h-7 md:px-3 md:py-1 md:text-[10px]"
            >
              <Icon icon="mdi:tag-outline" className="h-3.5 w-3.5" />
              {tagOrganizeMode ? t("tagOrganizeExit") : t("tagOrganize")}
            </button>
            <button
              type="button"
              onClick={onToggleSelection}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-neutral-600 dark:border-white/16 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14] md:min-h-7 md:px-3 md:py-1 md:text-[10px]"
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
              {selectionMode ? t("selectionExit") : t("selection")}
            </button>
            </div>
          </div>

          <div
            className={`relative flex w-full items-center gap-1.5 ${
              previewOpen
                ? "md:flex-wrap md:justify-end"
                : "md:w-auto md:flex-nowrap md:justify-end"
            }`}
          >
            {!hideViewModeToggle && (
              <div className="inline-flex min-w-0 shrink-0 overflow-hidden rounded-full border border-slate-600 bg-white text-[11px] font-semibold text-neutral-800 shadow-sm dark:border-white/16 dark:bg-white/[0.08] dark:text-white/85 md:text-[10px]">
                <button
                  type="button"
                  onClick={() => onViewModeChange("card")}
                  className={`px-2.5 py-1 md:px-3 md:py-1 ${
                    viewMode === "card"
                      ? "bg-neutral-700 text-white"
                      : "hover:bg-neutral-50 dark:hover:bg-white/10"
                  }`}
                >
                  {t("card")}
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange("table")}
                  className={`px-2.5 py-1 md:px-3 md:py-1 ${
                    viewMode === "table"
                      ? "bg-neutral-700 text-white"
                      : "hover:bg-neutral-50 dark:hover:bg-white/10"
                  }`}
                >
                  {t("table")}
                </button>
              </div>
            )}
            <label className="sr-only" htmlFor="maps-sort">
              {t("sortLabel")}
            </label>
            <select
              id="maps-sort"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortValue)}
              className="min-w-0 flex-1 rounded-full border border-slate-600 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50 dark:border-white/16 dark:bg-white/[0.08] dark:text-white/85 dark:hover:bg-white/[0.12] md:flex-none md:px-3 md:py-1 md:text-[10px]"
            >
              <option value="created_desc">{t("sort.createdDesc")}</option>
              <option value="created_asc">{t("sort.createdAsc")}</option>
              <option value="updated_desc">{t("sort.updatedDesc")}</option>
              <option value="title_asc">{t("sort.titleAsc")}</option>
            </select>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200/80 bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-blue-300/18 dark:bg-blue-400/10 dark:text-blue-200 dark:hover:bg-blue-400/16 md:h-7 md:w-7"
              aria-label={refreshing ? t("refreshing") : t("refresh")}
            >
              <Icon
                icon="mdi:refresh"
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              ref={filterButtonRef}
              type="button"
              onClick={onToggleFilters}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-700 text-white shadow-sm hover:bg-neutral-600 dark:border-white/16 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14] md:h-7 md:w-7"
              aria-label={filtersOpen ? t("filterClose") : t("filterOpen")}
            >
              <Icon icon="mdi:filter-variant" className="h-4 w-4 md:h-3.5 md:w-3.5" />
            </button>
            {showResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="rounded-full border border-rose-400 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 shadow-sm hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20 md:px-3 md:py-1 md:text-[10px]"
              >
                {t("resetFilters")}
              </button>
            )}
            {filtersOpen &&
              (isValidElement(filterPopover)
                ? cloneElement(
                    filterPopover as React.ReactElement<{ anchorRect?: DOMRect | null }>,
                    {
                      anchorRect: filterAnchorRect,
                    }
                  )
                : filterPopover)}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
