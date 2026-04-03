"use client";

import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import { Link } from "@/i18n/navigation";
import MapMiniPreview, {
  type MapMiniPreviewHandle,
} from "@/components/maps/MapMiniPreview";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";

type MindNode = {
  id?: string;
  topic?: string;
  expanded?: boolean;
  children?: MindNode[];
};

type PreviewMindData =
  | { nodeData?: MindNode; data?: { nodeData?: MindNode }; root?: { nodeData?: MindNode } }
  | MindNode
  | null;

function formatDate(draft: MapDraft, locale: string) {
  const value = draft.updatedAt ?? draft.createdAt;
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getDisplayTitle(draft: MapDraft) {
  return draft.shortTitle?.trim() || draft.title;
}

export default function MapPreviewPanel({
  draft,
  previewData,
  previewStatus,
  emptyMessage,
  isOpen,
  onOpen,
  onClose,
}: {
  draft: MapDraft | null;
  previewData: PreviewMindData;
  previewStatus: "idle" | "loading" | "loaded" | "missing" | "error";
  emptyMessage: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("MapsCommon.previewPanel");
  const miniRef = useRef<MapMiniPreviewHandle | null>(null);
  const autoZoomedMapIdRef = useRef<string | null>(null);
  const summary = draft?.summary ?? draft?.description ?? t("noSummary");

  useEffect(() => {
    if (previewStatus !== "loaded" || !draft?.id) return;
    if (autoZoomedMapIdRef.current === draft.id) return;

    autoZoomedMapIdRef.current = draft.id;

    const timer = window.setTimeout(() => {
      miniRef.current?.zoomIn();
      miniRef.current?.zoomIn();
      miniRef.current?.zoomIn();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [draft?.id, previewStatus]);

  if (!draft) {
    return (
      <aside className="rounded-2xl border border-slate-400 bg-white p-5 text-base text-neutral-600 dark:border-white/20 dark:bg-white/[0.04] dark:text-white/70">
        {emptyMessage}
      </aside>
    );
  }

  if (!isOpen) {
    return (
      <aside className="rounded-2xl border border-slate-400 bg-white p-5 dark:border-white/20 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              {t("closedTitle")}
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-white/70">
              {t("closedDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center justify-center rounded-full border border-slate-400 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
          >
            {t("openPreview")}
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-slate-400 bg-white p-5 dark:border-white/20 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white line-clamp-2">
            {getDisplayTitle(draft)}
          </h2>
          <div className="mt-1 text-sm text-neutral-600 dark:text-white/70">
            {formatDate(draft, locale)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-400 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-700 hover:border-slate-500 hover:bg-neutral-50 hover:text-neutral-900 hover:shadow-sm cursor-pointer dark:border-white/20 dark:bg-white/[0.06] dark:text-white/85 dark:hover:border-white/40 dark:hover:bg-white/10"
          >
            {t("close")}
          </button>
          <Link
            href={`/maps/${draft.id}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-400 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-700 hover:border-slate-500 hover:bg-neutral-50 hover:text-neutral-900 hover:shadow-sm cursor-pointer dark:border-white/20 dark:bg-white/[0.06] dark:text-white/85 dark:hover:border-white/40 dark:hover:bg-white/10"
          >
            {t("open")}
          </Link>
        </div>
      </div>

      {draft.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {draft.tags.slice(0, 10).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-400 bg-neutral-50 px-2.5 py-1 text-[12px] font-medium text-neutral-700 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 relative">
        {previewStatus === "loading" && (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-slate-400 bg-neutral-50 text-sm text-neutral-600 dark:border-white/20 dark:bg-white/[0.04] dark:text-white/70">
            {t("loading")}
          </div>
        )}

        {previewStatus === "error" && (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-sm font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
            {t("loadFailed")}
          </div>
        )}

        {previewStatus === "missing" && (
          <MapMiniPreview ref={miniRef} data={null} emptyText="Preview unavailable" />
        )}

        {previewStatus === "loaded" && (
          <MapMiniPreview ref={miniRef} data={previewData} emptyText="Preview unavailable" />
        )}

        {previewStatus === "idle" && (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-slate-400 bg-neutral-50 text-sm text-neutral-600 dark:border-white/20 dark:bg-white/[0.04] dark:text-white/70">
            {t("idle")}
          </div>
        )}

        {previewStatus === "loaded" && (
          <div className="absolute bottom-3 right-3 flex items-center rounded-full border border-slate-400 bg-white/90 text-sm font-semibold text-neutral-700 shadow-sm dark:border-white/20 dark:bg-[#0b1220]/75 dark:text-white/85">
            <button
              type="button"
              onClick={() => miniRef.current?.center()}
              className="px-2.5 py-1.5 hover:bg-neutral-50 dark:hover:bg-white/10"
              aria-label="Center map"
            >
              ⌖
            </button>
            <div className="h-4 w-px bg-slate-400 dark:bg-white/20" />
            <button
              type="button"
              onClick={() => miniRef.current?.zoomOut()}
              className="px-2.5 py-1.5 hover:bg-neutral-50 dark:hover:bg-white/10"
              aria-label="Zoom out"
            >
              –
            </button>
            <div className="h-4 w-px bg-slate-400 dark:bg-white/20" />
            <button
              type="button"
              onClick={() => miniRef.current?.zoomIn()}
              className="px-2.5 py-1.5 hover:bg-neutral-50 dark:hover:bg-white/10"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 text-sm text-neutral-700 line-clamp-2 dark:text-white/75">
        {summary}
      </p>
    </aside>
  );
}
