"use client";

import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";

type SourceType = "youtube" | "website" | "file" | "manual";

type MapTableListProps = {
  drafts: MapDraft[];
  selectedId: string | null;
  previewOpen: boolean;
  selectionMode: boolean;
  tagOrganizeMode: boolean;
  selectedMapIds: string[];
  onSelect: (draft: MapDraft) => void;
  onToggleSelect: (draft: MapDraft) => void;
  onEditTags: (draft: MapDraft) => void;
  onOpenDetail?: (draft: MapDraft) => void;
  onPrefetchDetail?: (draft: MapDraft) => void;
  openingDetailId?: string | null;
  showEditTags: boolean;
  showOpenDetail?: boolean;
  statusLabels: Record<MapJobStatus, string>;
  sourceLabels: Record<SourceType, string>;
};

function getDisplayTitle(draft: MapDraft) {
  const baseTitle = draft.shortTitle?.trim() || draft.title;
  const channel = draft.channelName?.trim();
  return channel ? `${baseTitle} [${channel}]` : baseTitle;
}

export default function MapTableList({
  drafts,
  selectedId,
  previewOpen,
  selectionMode,
  tagOrganizeMode,
  selectedMapIds,
  onSelect,
  onToggleSelect,
  onEditTags,
  onOpenDetail,
  onPrefetchDetail,
  openingDetailId,
  showEditTags,
  showOpenDetail = false,
  statusLabels,
  sourceLabels,
}: MapTableListProps) {
  const locale = useLocale();
  const t = useTranslations("MapsCommon.tableList");
  const renderStatusBadge = (draft: MapDraft) => {
    const statusBadge =
      draft.status === "failed"
        ? {
            label: statusLabels[draft.status] ?? t("status.failed"),
            cls: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-200",
          }
        : draft.status === "processing"
        ? {
            label: statusLabels[draft.status] ?? t("status.processing"),
            cls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/25 dark:bg-blue-500/10 dark:text-blue-200",
          }
        : null;

    return statusBadge ? (
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.cls}`}
      >
        {statusBadge.label}
      </span>
    ) : null;
  };

  return (
    <>
      <div className="mt-4 space-y-2 md:hidden">
        {drafts.map((draft) => {
          const isSelected = previewOpen && draft.id === selectedId;
          const isOpeningDetail = openingDetailId === draft.id;
          const canOpenDetail = draft.status === "done";
          const displayTitle = getDisplayTitle(draft);
          const tags = draft.tags ?? [];
          const visibleTags = tags.slice(0, 2);
          const remainingTags = tags.length - visibleTags.length;

          return (
            <article
              key={draft.id}
              className={`rounded-2xl border px-3 py-3 shadow-sm transition ${
                isSelected
                  ? "border-[color:var(--color-primary-600)] bg-[rgba(37,99,235,0.08)] dark:border-[color:var(--color-primary-400)] dark:bg-[rgba(96,165,250,0.12)]"
                  : "border-neutral-200 bg-white dark:border-white/10 dark:bg-[#0f1724]"
              }`}
              onClick={() => {
                if (tagOrganizeMode) return;
                onSelect(draft);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (tagOrganizeMode) return;
                  onSelect(draft);
                }
              }}
            >
              <div className="flex items-start gap-2">
                {selectionMode && !tagOrganizeMode && (
                  <input
                    type="checkbox"
                    checked={selectedMapIds.includes(draft.id)}
                    onChange={() => onToggleSelect(draft)}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300 text-neutral-900"
                    aria-label={t("selectAria", { title: displayTitle })}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        {renderStatusBadge(draft)}
                        <div className="min-w-0 flex-1 text-[14px] font-medium leading-5 text-neutral-800 line-clamp-2 dark:text-white/85">
                          {displayTitle}
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500 dark:text-white/55">
                        <span>{draft.sourceType ? sourceLabels[draft.sourceType] : "-"}</span>
                        <span>·</span>
                        <span>
                          {draft.updatedAt
                            ? new Date(draft.updatedAt).toLocaleDateString(locale, {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              })
                            : "-"}
                        </span>
                      </div>
                    </div>
                    {showOpenDetail && onOpenDetail && canOpenDetail && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (isOpeningDetail) return;
                          onOpenDetail(draft);
                        }}
                        onMouseEnter={() => onPrefetchDetail?.(draft)}
                        onFocus={() => onPrefetchDetail?.(draft)}
                        disabled={isOpeningDetail}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 disabled:cursor-wait disabled:opacity-80 dark:border-white/12 dark:bg-white/[0.05] dark:text-white/80"
                      >
                        <Icon
                          icon={isOpeningDetail ? "mdi:loading" : "mdi:open-in-new"}
                          className={`h-3.5 w-3.5 ${isOpeningDetail ? "animate-spin" : ""}`}
                        />
                        {isOpeningDetail ? t("opening") : t("open")}
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 text-[12px] leading-5 text-neutral-600 dark:text-white/70">
                      {visibleTags.length > 0
                        ? `${visibleTags.map((tag) => `#${tag}`).join(" ")}${
                            remainingTags > 0 ? ` +${remainingTags}` : ""
                          }`
                        : "-"}
                    </span>
                    {showEditTags && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEditTags(draft);
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-500/10"
                      >
                        <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                        {t("editTags")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-4 hidden w-full min-w-0 overflow-x-auto rounded-2xl border border-blue-200/50 bg-white shadow-sm dark:border-blue-300/10 dark:bg-[#0f1724] dark:shadow-[0_20px_40px_-28px_rgba(2,6,23,0.82)] md:block">
      <table className="min-w-[760px] w-full table-fixed text-left text-[13px] [table-layout:fixed]">
        <colgroup>
          {selectionMode && !tagOrganizeMode && <col style={{ width: "24px" }} />}
          <col style={{ width: "304px" }} />
          <col style={{ width: "64px" }} />
          <col style={{ width: "230px" }} />
          <col style={{ width: "110px" }} />
        </colgroup>
        <thead className="text-[12px] font-semibold text-neutral-700 dark:text-white/82">
          <tr className="border-b border-neutral-300 bg-blue-50/50 dark:border-white/10 dark:bg-[#111b2b]">
            {selectionMode && !tagOrganizeMode && (
              <th className="w-6 min-w-[24px] max-w-[24px] px-[3px] py-1.5 border-r border-neutral-200 dark:border-white/8 text-center">
                <span className="sr-only">{t("select")}</span>
              </th>
            )}
            <th className="px-2 py-1.5 border-r border-neutral-200 dark:border-white/8">
              {t("columns.title")}
            </th>
            <th className="w-[64px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/8">
              {t("columns.source")}
            </th>
            <th className="w-[230px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/8">
              {t("columns.tags")}
            </th>
            <th className="w-[110px] px-2 py-1.5">{t("columns.updatedAt")}</th>
          </tr>
        </thead>
        <tbody>
          {drafts.map((draft) => {
            const isSelected = previewOpen && draft.id === selectedId;
            const isOpeningDetail = openingDetailId === draft.id;
            const canOpenDetail = draft.status === "done";
            const displayTitle = getDisplayTitle(draft);
            const tags = draft.tags ?? [];
            const visibleTags = tags.slice(0, 2);
            const remainingTags = tags.length - visibleTags.length;
            return (
              <tr
                key={draft.id}
                className={`border-b border-neutral-200 hover:bg-neutral-50 dark:border-white/6 dark:hover:bg-white/[0.04] ${
                  isSelected
                    ? "bg-[rgba(37,99,235,0.08)] dark:bg-[rgba(96,165,250,0.12)]"
                    : "dark:odd:bg-white/[0.02] dark:even:bg-transparent"
                }`}
                onClick={() => {
                  if (tagOrganizeMode) return;
                  onSelect(draft);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (tagOrganizeMode) return;
                    onSelect(draft);
                  }
                }}
              >
                {selectionMode && !tagOrganizeMode && (
                  <td className="w-6 min-w-[24px] max-w-[24px] px-[3px] py-1.5 border-r border-neutral-200 dark:border-white/8 text-center">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedMapIds.includes(draft.id)}
                        onChange={() => onToggleSelect(draft)}
                        onClick={(event) => event.stopPropagation()}
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
                        aria-label={t("selectAria", { title: displayTitle })}
                      />
                    </div>
                  </td>
                )}
                <td className="px-2 py-1.5 border-r border-neutral-200 dark:border-white/8">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex flex-1 items-center gap-2">
                      {renderStatusBadge(draft)}
                      <div className="min-w-0 flex-1 truncate text-[14px] font-medium text-neutral-800 dark:text-white/92">
                        {displayTitle}
                      </div>
                    </div>
                    {showOpenDetail && onOpenDetail && canOpenDetail && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (isOpeningDetail) return;
                            onOpenDetail(draft);
                          }}
                          onMouseEnter={() => onPrefetchDetail?.(draft)}
                          onFocus={() => onPrefetchDetail?.(draft)}
                          disabled={isOpeningDetail}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-200/80 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 hover:shadow-sm disabled:cursor-wait disabled:opacity-80 dark:border-blue-300/18 dark:bg-blue-400/10 dark:text-blue-200 dark:hover:border-sky-300/24 dark:hover:bg-blue-400/16"
                        >
                          <Icon
                            icon={isOpeningDetail ? "mdi:loading" : "mdi:open-in-new"}
                            className={`h-3.5 w-3.5 ${isOpeningDetail ? "animate-spin" : ""}`}
                          />
                          {isOpeningDetail ? t("opening") : t("open")}
                        </button>
                    )}
                  </div>
                </td>
                <td className="w-[64px] px-2 py-1.5 text-[13px] text-neutral-700 dark:text-white/70 border-r border-neutral-200 dark:border-white/8">
                  {draft.sourceType ? sourceLabels[draft.sourceType] : "-"}
                </td>
                <td className="w-[230px] px-2 py-1.5 text-neutral-600 dark:text-white/76 border-r border-neutral-200 dark:border-white/8">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-h-[36px] flex-1 text-[12px] leading-5 text-neutral-700 dark:text-white/88 line-clamp-2">
                      {visibleTags.length > 0
                        ? `${visibleTags.map((tag) => `#${tag}`).join(" ")}${
                            remainingTags > 0 ? ` +${remainingTags}` : ""
                          }`
                        : "-"}
                    </span>
                      {showEditTags && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditTags(draft);
                          }}
                          className="inline-flex items-center gap-1 self-start rounded-md px-1 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-50 cursor-pointer dark:text-sky-200 dark:hover:bg-white/[0.06]"
                        >
                          <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                          {t("editTags")}
                        </button>
                    )}
                  </div>
                </td>
                <td className="w-[110px] px-2 py-1.5 text-[12px] font-medium text-neutral-600 dark:text-white/84 whitespace-nowrap">
                  {draft.updatedAt
                    ? new Date(draft.updatedAt).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}
