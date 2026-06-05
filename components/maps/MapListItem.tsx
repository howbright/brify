"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import { getMapStructurePreview } from "@/components/maps/mapStructurePreview";

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
  const baseTitle = draft.title;
  const channel = draft.channelName?.trim();
  return channel ? `${baseTitle} [${channel}]` : baseTitle;
}

function getReadStateTopBorderClass(readStatus?: MapDraft["readStatus"]) {
  if (readStatus === "read") {
    return "border-t-2 border-t-emerald-400 dark:border-t-emerald-300/90";
  }
  if (readStatus === "in_progress") {
    return "border-t-2 border-t-blue-400 dark:border-t-sky-300/90";
  }
  return "border-t-2 border-t-slate-300 dark:border-t-slate-500/80";
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
      : draft.status === "processing_structure" || draft.status === "processing_metadata"
      ? {
          text: t("status.processing"),
          dotCls: "bg-blue-500 dark:bg-blue-300",
          textCls: "text-blue-700 dark:text-blue-200",
        }
      : null;
  const readStateBadge =
    draft.readStatus === "read"
      ? {
          text: t("readState.read"),
          cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-200 dark:border-emerald-400/25",
        }
      : draft.readStatus === "in_progress"
      ? {
          text: t("readState.inProgress"),
          cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/12 dark:text-blue-200 dark:border-blue-400/25",
        }
      : {
          text: t("readState.unread"),
          cls: "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-white/10 dark:text-white/75 dark:border-white/15",
        };

  const displayTitle = getDisplayTitle(draft);
  const visibleTags = draft.tags?.slice(0, 4) ?? [];
  const remainingTagCount = Math.max((draft.tags?.length ?? 0) - visibleTags.length, 0);
  const notesCount = draft.notesCount ?? 0;
  const termsCount = draft.termsCount ?? 0;
  const hasTopActionMenu = Boolean(onDelete);
  const isOpeningDetail = openingDetailId === draft.id;
  const summary = (draft.summary ?? draft.description ?? "").trim();
  const structurePreview = useMemo(
    () => getMapStructurePreview(draft.result, 5),
    [draft.result]
  );
  const canOpenDetailFromTitle =
    Boolean(onOpenDetail && showOpenDetail) && !selectionMode;
  const readStateTopBorderClass = getReadStateTopBorderClass(draft.readStatus);

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
      className={`relative flex h-full w-full max-w-full min-w-0 box-border flex-col rounded-2xl border px-3 py-3 transition md:px-4 md:py-3.5
        ${
          isActive
            ? "border-[color:var(--color-primary-600)] bg-[rgba(37,99,235,0.07)] shadow-[0_18px_34px_-28px_rgba(37,99,235,0.24)] dark:border-[color:var(--color-primary-400)] dark:bg-[rgba(96,165,250,0.11)] dark:shadow-[0_22px_40px_-26px_rgba(37,99,235,0.28)]"
            : "border-slate-300 bg-white shadow-[0_14px_30px_-24px_rgba(15,23,42,0.18)] hover:border-slate-400 hover:bg-slate-50/70 hover:shadow-[0_18px_34px_-24px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(13,20,32,0.98),rgba(8,14,24,1))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_48px_-34px_rgba(2,6,23,0.94)] dark:hover:border-sky-300/22 dark:hover:bg-[linear-gradient(180deg,rgba(18,28,43,0.99),rgba(11,18,29,1))]"
        } ${readStateTopBorderClass}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className={`min-w-0 ${hasTopActionMenu ? "pr-12" : ""}`}>
          <div className="flex min-w-0 items-start gap-2">
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
            <div className="min-w-0 flex-1">
              {canOpenDetailFromTitle ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isOpeningDetail) return;
                    onOpenDetail?.(draft);
                  }}
                  onMouseEnter={() => onPrefetchDetail?.(draft)}
                  onFocus={() => onPrefetchDetail?.(draft)}
                  aria-busy={isOpeningDetail ? "true" : "false"}
                  className="min-w-0 max-w-full text-left"
                >
                  <h3 className="min-w-0 text-[14px] font-semibold leading-5 text-slate-900 line-clamp-2 transition hover:text-blue-700 dark:text-white/94 dark:hover:text-blue-200 md:text-[15px] md:leading-5">
                    {displayTitle}
                  </h3>
                </button>
              ) : (
                <h3 className="min-w-0 text-[14px] font-semibold leading-5 text-slate-900 line-clamp-2 dark:text-white/94 md:text-[15px] md:leading-5">
                  {displayTitle}
                </h3>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                {sourceBadge && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sourceBadge.cls} ${sourceBadge.darkCls}`}
                  >
                    {sourceBadge.label}
                  </span>
                )}
                {statusBadge && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${statusBadge.textCls}`}>
                    <span className={`h-2 w-2 rounded-full ${statusBadge.dotCls}`} />
                    {statusBadge.text}
                  </span>
                )}
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${readStateBadge.cls}`}>
                  {readStateBadge.text}
                </span>
                {draft.starred ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/12 dark:text-amber-200">
                    <Icon icon="mdi:star" className="h-3 w-3" />
                    {t("readState.starred")}
                  </span>
                ) : null}
                <span className="text-[11px] font-medium text-slate-500 dark:text-white/52">
                  {formatDate(draft, locale)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {hasTopActionMenu ? (
          <div className="absolute right-3 top-3 flex items-center gap-2 md:right-4 md:top-3.5">
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white p-1.5 text-neutral-500 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62 dark:hover:bg-white/[0.08]"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="More actions"
              >
                <Icon icon="mdi:dots-horizontal" className="h-4.5 w-4.5" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 min-w-[140px] rounded-2xl border border-slate-400 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0c1523]"
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

        <div className="min-w-0">
          <div className="min-w-0">
            {structurePreview ? (
              <div className="min-w-0">
                {structurePreview.rootTopic ? (
                  <p className="inline-flex max-w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-semibold leading-5 text-slate-800 shadow-[0_8px_18px_-16px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/[0.065] dark:text-white/82 md:text-[13px]">
                    <span className="line-clamp-1">
                      {structurePreview.rootTopic}
                    </span>
                  </p>
                ) : null}
                {structurePreview.childTopics.length ? (
                  <div className="relative ml-2 mt-2 flex min-w-0 flex-col gap-1.5 pl-4 before:absolute before:bottom-2 before:left-0 before:top-0 before:w-px before:bg-slate-200 dark:before:bg-white/12">
                    {structurePreview.childTopics.map((topic, index) => (
                      <span
                        key={`${topic}-${index}`}
                        className="relative block max-w-full truncate rounded-md border border-slate-200/80 bg-white px-2 py-1 text-[10px] font-medium leading-4 text-slate-600 shadow-[0_8px_16px_-18px_rgba(15,23,42,0.28)] before:absolute before:left-[-16px] before:top-1/2 before:h-px before:w-4 before:bg-slate-200 dark:border-white/10 dark:bg-white/[0.045] dark:text-white/68 dark:before:bg-white/12 md:text-[11px]"
                      >
                        {topic}
                      </span>
                    ))}
                    {structurePreview.remainingChildCount > 0 ? (
                      <span className="relative block text-[10px] font-medium leading-4 text-slate-500 before:absolute before:left-[-16px] before:top-1/2 before:h-px before:w-4 before:bg-slate-200 dark:text-white/54 dark:before:bg-white/12 md:text-[11px]">
                        +{structurePreview.remainingChildCount}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : summary ? (
              <p className="line-clamp-2 text-[12px] leading-5 text-slate-600 dark:text-white/68 md:text-[13px]">
                {summary}
              </p>
            ) : (
              <p className="text-[12px] leading-5 text-slate-400 dark:text-white/38 md:text-[13px]">
                {t("noSummary")}
              </p>
            )}

            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
              {visibleTags.length ? (
                <>
                  {visibleTags.map((tag) => (
                    <span
                      key={tag}
                      className="max-w-full break-all rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium leading-4 text-slate-600 dark:bg-white/[0.06] dark:text-white/70 md:max-w-[140px] md:truncate md:break-normal md:px-2 md:text-[11px]"
                    >
                      #{tag}
                    </span>
                  ))}
                  {remainingTagCount > 0 && (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/[0.06] dark:text-white/60 md:px-2 md:text-[11px]">
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
                      className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-500/10 md:text-[11px]"
                      aria-label={t("editTags")}
                    >
                      <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                      <span>{t("editTags")}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[10px] text-slate-500 dark:text-white/50 md:text-[11px]">
                    {t("noTag")}
                  </span>
                  {showEditTags && onEditTags && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditTags(draft);
                      }}
                      className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-500/10 md:text-[11px]"
                      aria-label={t("editTags")}
                    >
                      <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                      <span>{t("editTags")}</span>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-200/80 bg-blue-50/85 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-300/14 dark:bg-blue-400/10 dark:text-blue-200/88 md:px-2 md:text-[11px]">
                <Icon icon="mdi:note-text-outline" className="h-3.5 w-3.5 shrink-0" />
                <span>{t("notesCount", { count: notesCount })}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-sky-200/80 bg-sky-50/85 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:border-sky-300/14 dark:bg-sky-400/10 dark:text-sky-200/88 md:px-2 md:text-[11px]">
                <Icon icon="mdi:book-outline" className="h-3.5 w-3.5 shrink-0" />
                <span>{t("termsCount", { count: termsCount })}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

    </article>
  );
}
