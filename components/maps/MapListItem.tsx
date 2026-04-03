"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";

type SourceBadge = {
  label: string;
  cls: string;
  darkCls: string;
};

function detectSourceType(draft: MapDraft): MapDraft["sourceType"] | undefined {
  if (draft.sourceType) return draft.sourceType;
  if (!draft.sourceUrl) return undefined;
  const lowered = draft.sourceUrl.toLowerCase();
  if (lowered.includes("youtube.com") || lowered.includes("youtu.be")) {
    return "youtube";
  }
  return "website";
}

function getSourceBadge(
  draft: MapDraft,
  labels: Record<NonNullable<MapDraft["sourceType"]>, string>
): SourceBadge | null {
  const sourceType = detectSourceType(draft);
  if (!sourceType) return null;
  if (sourceType === "youtube") {
    return {
      label: labels.youtube,
      cls: "bg-red-50 text-red-600 border-red-200",
      darkCls: "dark:bg-rose-500/12 dark:text-rose-200 dark:border-rose-400/25",
    };
  }
  if (sourceType === "website") {
    return {
      label: labels.website,
      cls: "bg-sky-50 text-sky-700 border-sky-200",
      darkCls: "dark:bg-sky-500/12 dark:text-sky-200 dark:border-sky-400/25",
    };
  }
  if (sourceType === "file") {
    return {
      label: labels.file,
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      darkCls:
        "dark:bg-amber-500/12 dark:text-amber-200 dark:border-amber-400/25",
    };
  }
  return {
    label: labels.manual,
    cls: "bg-neutral-100 text-neutral-600 border-neutral-200",
    darkCls: "dark:bg-white/10 dark:text-white/70 dark:border-white/15",
  };
}

function formatDate(draft: MapDraft, locale: string) {
  const value = draft.updatedAt ?? draft.createdAt;
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getDisplayTitle(draft: MapDraft) {
  const baseTitle = draft.shortTitle?.trim() || draft.title;
  const channel = draft.channelName?.trim();
  return channel ? `${baseTitle} [${channel}]` : baseTitle;
}

export default function MapListItem({
  draft,
  selected = false,
  selectionMode = false,
  checked = false,
  onSelect,
  onToggleSelect,
  onDelete,
  isDeleting = false,
  onEditTags,
  showEditTags = false,
  onOpenDetail,
  onPrefetchDetail,
  openingDetailId,
  showOpenDetail = false,
}: {
  draft: MapDraft;
  selected?: boolean;
  selectionMode?: boolean;
  checked?: boolean;
  onSelect?: (draft: MapDraft) => void;
  onToggleSelect?: (draft: MapDraft) => void;
  onDelete?: (draft: MapDraft) => void;
  isDeleting?: boolean;
  onEditTags?: (draft: MapDraft) => void;
  showEditTags?: boolean;
  onOpenDetail?: (draft: MapDraft) => void;
  onPrefetchDetail?: (draft: MapDraft) => void;
  openingDetailId?: string | null;
  showOpenDetail?: boolean;
}) {
  const t = useTranslations("MapsCommon.listItem");
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const sourceBadge = useMemo(
    () =>
      getSourceBadge(draft, {
        youtube: t("source.youtube"),
        website: t("source.website"),
        file: t("source.file"),
        manual: t("source.manual"),
      }),
    [draft, t]
  );
  const statusBadge =
    draft.status === "failed"
      ? {
          text: t("status.failed"),
          dotCls: "bg-rose-500 dark:bg-rose-300",
          textCls: "text-rose-700 dark:text-rose-200",
        }
      : draft.status === "processing"
      ? {
          text: t("status.processing"),
          dotCls: "bg-blue-500 dark:bg-blue-300",
          textCls: "text-blue-700 dark:text-blue-200",
        }
      : null;

  const displayTitle = getDisplayTitle(draft);
  const visibleTags = draft.tags?.slice(0, 6) ?? [];
  const remainingTagCount = Math.max((draft.tags?.length ?? 0) - visibleTags.length, 0);
  const hasTopActionMenu = Boolean(onDelete);
  const isOpeningDetail = openingDetailId === draft.id;

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!menuRef.current || !target) return;
      if (!menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [menuOpen]);

  const isActive = selectionMode ? checked : selected;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => {
        if (selectionMode) {
          onToggleSelect?.(draft);
          return;
        }
        onSelect?.(draft);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (selectionMode) {
            onToggleSelect?.(draft);
            return;
          }
          onSelect?.(draft);
        }
      }}
      className={`relative flex h-full w-full max-w-full min-w-0 box-border flex-col rounded-2xl border px-3 py-2.5 transition md:px-4 md:py-3
        ${
          isActive
            ? "border-blue-300 bg-blue-50/70 shadow-sm dark:border-blue-300/50 dark:bg-[rgba(37,99,235,0.18)] dark:shadow-[0_18px_36px_-24px_rgba(37,99,235,0.45)]"
            : "border-slate-400 bg-white hover:bg-neutral-50 dark:border-slate-300/18 dark:bg-[linear-gradient(180deg,rgba(26,36,52,0.94),rgba(17,24,39,0.98))] dark:shadow-[0_24px_48px_-28px_rgba(2,6,23,0.96)] dark:hover:border-sky-300/18 dark:hover:bg-[linear-gradient(180deg,rgba(31,43,63,0.98),rgba(20,30,48,1))]"
        }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 md:gap-3">
        <div className={`min-w-0 ${hasTopActionMenu ? "pr-20 sm:pr-0" : ""}`}>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {selectionMode && (
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleSelect?.(draft)}
                onClick={(event) => event.stopPropagation()}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
                aria-label={t("selectAria", { title: displayTitle })}
              />
            )}
            <h3 className="min-w-0 text-[14px] font-medium leading-5 text-neutral-800 line-clamp-2 dark:text-white/85 md:text-[16px] md:font-semibold md:leading-6 md:text-neutral-900 md:dark:text-white">
              {displayTitle}
            </h3>
          </div>
        </div>

        {hasTopActionMenu ? (
          <div className="absolute right-3 top-2.5 flex items-center gap-2 md:right-4 md:top-3">
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-400 bg-white p-1.5 text-neutral-500 hover:bg-neutral-50 dark:border-white/16 dark:bg-white/[0.08] dark:text-white/70 dark:hover:bg-white/12"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="More actions"
              >
                <Icon icon="mdi:dots-horizontal" className="h-4.5 w-4.5" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 min-w-[140px] rounded-2xl border border-slate-400 bg-white p-1 shadow-lg dark:border-white/16 dark:bg-[#111a2b]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.(draft);
                    }}
                    disabled={isDeleting}
                    className="w-full rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon
                        icon={isDeleting ? "mdi:loading" : "mdi:trash-outline"}
                        className={`h-4 w-4 ${isDeleting ? "animate-spin" : ""}`}
                      />
                      {isDeleting ? t("deleting") : t("delete")}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 items-start gap-2.5 md:gap-3">
          <div className="aspect-video w-20 shrink-0 overflow-hidden rounded-lg border border-slate-400 bg-neutral-50 dark:border-white/16 dark:bg-white/[0.06] md:w-24 md:rounded-xl">
            {draft.thumbnailUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.thumbnailUrl}
                  alt={displayTitle}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-fuchsia-50 text-indigo-600 dark:from-indigo-500/10 dark:via-white/5 dark:to-fuchsia-500/10 dark:text-indigo-200">
                <Icon icon="mdi:map-outline" className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {sourceBadge && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold md:px-2.5 md:text-[11px] ${sourceBadge.cls} ${sourceBadge.darkCls}`}
                >
                  {sourceBadge.label}
                </span>
              )}
              {statusBadge && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium md:gap-1.5 md:text-[12px] ${statusBadge.textCls}`}>
                  <span className={`h-2 w-2 rounded-full ${statusBadge.dotCls}`} />
                  {statusBadge.text}
                </span>
              )}
            </div>

            <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1 md:mt-2 md:gap-1.5">
              {visibleTags.length ? (
                <>
                  {visibleTags.map((tag) => (
                    <span
                      key={tag}
                      className="max-w-full break-all rounded-lg bg-neutral-100/90 px-1.5 py-0.5 text-[11px] font-medium leading-4 text-neutral-600 dark:bg-white/[0.06] dark:text-white/70 md:px-2 md:py-1 md:text-[12px] md:max-w-[140px] md:truncate md:break-normal"
                    >
                      #{tag}
                    </span>
                  ))}
                  {remainingTagCount > 0 && (
                    <span className="rounded-lg bg-neutral-100/90 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-white/[0.06] dark:text-white/60 md:px-2 md:py-1 md:text-[12px]">
                      +{remainingTagCount}
                    </span>
                  )}
                  {showEditTags && onEditTags && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditTags(draft);
                      }}
                      className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-500/10"
                      aria-label={t("editTags")}
                    >
                      <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                      <span>{t("editTags")}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[11px] text-neutral-500 dark:text-white/50 md:text-[12px]">
                    {t("noTag")}
                  </span>
                  {showEditTags && onEditTags && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditTags(draft);
                      }}
                      className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-500/10"
                      aria-label={t("editTags")}
                    >
                      <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                      <span>{t("editTags")}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-[12px] font-medium text-neutral-500 dark:text-white/60 md:pt-3 md:text-[13px]">
        <span>{formatDate(draft, locale)}</span>
        {onOpenDetail && showOpenDetail && (
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
            className="inline-flex items-center gap-1 rounded-full border border-slate-400 bg-white px-2.5 py-1 text-[10px] font-semibold text-neutral-700 hover:border-slate-500 hover:bg-neutral-50 hover:text-neutral-900 hover:shadow-sm disabled:cursor-wait disabled:opacity-80 dark:border-white/16 dark:bg-white/[0.08] dark:text-white/82 dark:hover:border-sky-300/26 dark:hover:bg-white/12 md:px-3 md:py-1.5 md:text-[11px]"
          >
            <Icon
              icon={isOpeningDetail ? "mdi:loading" : "mdi:open-in-new"}
              className={`h-3.5 w-3.5 ${isOpeningDetail ? "animate-spin" : ""}`}
            />
            {isOpeningDetail ? t("opening") : t("open")}
          </button>
        )}
      </div>
    </article>
  );
}
