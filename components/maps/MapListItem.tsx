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
      aria-selected={isActive}
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
      className={`w-full max-w-full min-w-0 box-border rounded-2xl border px-4 py-3 transition
        ${
          isActive
            ? "border-blue-300 bg-blue-50/70 shadow-sm dark:border-blue-400/40 dark:bg-blue-500/10"
            : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-white/10 dark:bg-[#0f172a]/40 dark:hover:bg-white/[0.05]"
        }`}
    >
      <div className="flex items-start justify-between gap-4 min-w-0">
        <div className="flex min-w-0 items-start gap-3">
          <div className="w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 aspect-video dark:border-white/10 dark:bg-white/[0.04]">
            {draft.thumbnailUrl ? (
              <img
                src={draft.thumbnailUrl}
                alt={draft.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-fuchsia-50 text-indigo-600 dark:from-indigo-500/10 dark:via-white/5 dark:to-fuchsia-500/10 dark:text-indigo-200">
                <Icon icon="mdi:map-outline" className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {selectionMode && (
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleSelect?.(draft)}
                  onClick={(event) => event.stopPropagation()}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
                  aria-label={`${draft.title} 선택`}
                />
              )}
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-1">
                {draft.title}
              </h3>
              {sourceBadge && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sourceBadge.cls} ${sourceBadge.darkCls}`}
                >
                  {sourceBadge.label}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-white/60 line-clamp-1">
              {summary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {statusBadge && (
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadge.cls} ${statusBadge.darkCls}`}
            >
              {statusBadge.text}
            </span>
          )}

          {onDelete && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white p-1 text-neutral-500 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/10"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="More actions"
              >
                <Icon icon="mdi:dots-horizontal" className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 min-w-[140px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(draft);
                    }}
                    disabled={isDeleting}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-500/10"
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
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 min-w-0">
        <div className="flex flex-nowrap gap-1.5 overflow-hidden min-w-0">
          {draft.tags?.length ? (
            <>
              {draft.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="max-w-[120px] truncate rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75"
                >
                  #{tag}
                </span>
              ))}
              {draft.tags.length > 4 && (
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60">
                  +{draft.tags.length - 4}
                </span>
              )}
            </>
          ) : (
            <span className="text-[11px] text-neutral-400 dark:text-white/40">
              태그 없음
            </span>
          )}
        </div>
        {onEditTags && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEditTags(draft);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/10"
          >
            <Icon icon="mdi:pencil" className="h-3 w-3" />
            편집
          </button>
        )}
      </div>

      <div className="mt-2 text-[11px] text-neutral-500 dark:text-white/60">
        {formatDate(draft)}
      </div>
    </article>
  );
}
