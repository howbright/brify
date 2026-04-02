"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
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

function getSourceBadge(draft: MapDraft): SourceBadge | null {
  const sourceType = detectSourceType(draft);
  if (!sourceType) return null;
  if (sourceType === "youtube") {
    return {
      label: "YouTube",
      cls: "bg-red-50 text-red-600 border-red-200",
      darkCls: "dark:bg-rose-500/12 dark:text-rose-200 dark:border-rose-400/25",
    };
  }
  if (sourceType === "website") {
    return {
      label: "Website",
      cls: "bg-sky-50 text-sky-700 border-sky-200",
      darkCls: "dark:bg-sky-500/12 dark:text-sky-200 dark:border-sky-400/25",
    };
  }
  if (sourceType === "file") {
    return {
      label: "File",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      darkCls:
        "dark:bg-amber-500/12 dark:text-amber-200 dark:border-amber-400/25",
    };
  }
  return {
    label: "Manual",
    cls: "bg-neutral-100 text-neutral-600 border-neutral-200",
    darkCls: "dark:bg-white/10 dark:text-white/70 dark:border-white/15",
  };
}

function formatDate(draft: MapDraft) {
  const value = draft.updatedAt ?? draft.createdAt;
  return new Date(value).toLocaleDateString("ko-KR", {
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
  showOpenDetail?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const sourceBadge = useMemo(() => getSourceBadge(draft), [draft]);
  const statusBadge =
    draft.status === "failed"
      ? {
          text: "실패",
          cls: "bg-rose-50 text-rose-600 border-rose-200",
          darkCls:
            "dark:bg-rose-500/12 dark:text-rose-200 dark:border-rose-400/25",
        }
      : draft.status === "processing"
      ? {
          text: "처리 중",
          cls: "bg-blue-50 text-blue-700 border-blue-200",
          darkCls:
            "dark:bg-blue-500/12 dark:text-blue-200 dark:border-blue-400/25",
        }
      : null;

  const summary =
    draft.summary ?? draft.description ?? "요약이 아직 없어요.";
  const displayTitle = getDisplayTitle(draft);
  const visibleTags = draft.tags?.slice(0, 6) ?? [];
  const remainingTagCount = Math.max((draft.tags?.length ?? 0) - visibleTags.length, 0);
  const hasTopActionMenu = Boolean(onDelete);

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
      className={`relative w-full max-w-full min-w-0 box-border rounded-2xl border px-4 py-3 transition
        ${
          isActive
            ? "border-blue-300 bg-blue-50/70 shadow-sm dark:border-blue-300/50 dark:bg-[rgba(37,99,235,0.18)] dark:shadow-[0_18px_36px_-24px_rgba(37,99,235,0.45)]"
            : "border-slate-400 bg-white hover:bg-neutral-50 dark:border-white/16 dark:bg-[rgba(15,23,42,0.82)] dark:shadow-[0_18px_36px_-28px_rgba(2,6,23,0.85)] dark:hover:border-white/24 dark:hover:bg-[rgba(30,41,59,0.92)]"
        }`}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className={`min-w-0 ${hasTopActionMenu ? "pr-20 sm:pr-0" : ""}`}>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {selectionMode && (
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleSelect?.(draft)}
                onClick={(event) => event.stopPropagation()}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
                aria-label={`${displayTitle} 선택`}
              />
            )}
            <h3 className="min-w-0 text-[17px] font-semibold leading-6 text-neutral-900 line-clamp-2 dark:text-white sm:text-base sm:line-clamp-1">
              {displayTitle}
            </h3>
          </div>
        </div>

        {hasTopActionMenu ? (
          <div className="absolute right-4 top-3 flex items-center gap-2">
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-400 bg-white p-1.5 text-neutral-500 hover:bg-neutral-50 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/10"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="More actions"
              >
                <Icon icon="mdi:dots-horizontal" className="h-4.5 w-4.5" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 min-w-[140px] rounded-2xl border border-slate-400 bg-white p-1 shadow-lg dark:border-white/20 dark:bg-[#0f172a]"
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
                      {isDeleting ? "삭제 중..." : "삭제"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 items-start gap-3">
          <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-xl border border-slate-400 bg-neutral-50 dark:border-white/20 dark:bg-white/[0.04] sm:w-20">
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
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${sourceBadge.cls} ${sourceBadge.darkCls}`}
                >
                  {sourceBadge.label}
                </span>
              )}
              {statusBadge && (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge.cls} ${statusBadge.darkCls}`}
                >
                  {statusBadge.text}
                </span>
              )}
            </div>

            <p className="mt-2 text-[13px] leading-5 text-neutral-600 line-clamp-3 dark:text-white/70 sm:text-sm sm:line-clamp-2">
              {summary}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 flex-col gap-2 sm:mt-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {visibleTags.length ? (
            <>
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="max-w-full break-all rounded-full border border-slate-400 bg-neutral-50 px-2.5 py-1 text-[12px] font-medium leading-4 text-neutral-700 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80 sm:max-w-[160px] sm:truncate sm:break-normal"
                >
                  #{tag}
                </span>
              ))}
              {remainingTagCount > 0 && (
                <span className="rounded-full border border-slate-400 bg-neutral-50 px-2.5 py-1 text-[12px] font-medium text-neutral-600 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/70">
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
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/70 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25"
                  aria-label="태그 편집"
                >
                  <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          ) : (
            <>
              <span className="text-[12px] text-neutral-500 dark:text-white/50">
                태그 없음
              </span>
              {showEditTags && onEditTags && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditTags(draft);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/70 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25"
                  aria-label="태그 편집"
                >
                  <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[13px] font-medium text-neutral-500 dark:text-white/60">
        <span>{formatDate(draft)}</span>
        {onOpenDetail && showOpenDetail && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetail(draft);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-slate-400 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-700 hover:border-slate-500 hover:bg-neutral-50 hover:text-neutral-900 hover:shadow-sm cursor-pointer dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80 dark:hover:border-white/40 dark:hover:bg-white/10"
          >
            <Icon icon="mdi:open-in-new" className="h-3.5 w-3.5" />
            열기
          </button>
        )}
      </div>
    </article>
  );
}
