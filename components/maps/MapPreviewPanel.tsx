"use client";

import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import { Link } from "@/i18n/navigation";
import MapMiniPreview, {
  type MapMiniPreviewHandle,
} from "@/components/maps/MapMiniPreview";
import { useRef } from "react";

function formatDate(draft: MapDraft) {
  const value = draft.updatedAt ?? draft.createdAt;
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
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
  previewData: any | null;
  previewStatus: "idle" | "loading" | "loaded" | "missing" | "error";
  emptyMessage: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  if (!draft) {
    return (
      <aside className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
        {emptyMessage}
      </aside>
    );
  }

  const summary = draft.summary ?? draft.description ?? "요약이 아직 없어요.";
  const miniRef = useRef<MapMiniPreviewHandle | null>(null);

  if (!isOpen) {
    return (
      <aside className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              미리보기 닫힘
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-white/60">
              빠른 비교를 위해 필요하면 다시 열 수 있어요.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
          >
            미리보기 열기
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white line-clamp-2">
            {draft.title}
          </h2>
          <div className="mt-1 text-xs text-neutral-500 dark:text-white/60">
            {formatDate(draft)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
          >
            미리보기 닫기
          </button>
          <Link
            href={`/maps/${draft.id}`}
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
          >
            Open Map
          </Link>
        </div>
      </div>

      {draft.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {draft.tags.slice(0, 10).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 relative">
        {previewStatus === "loading" && (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
            미리보기 불러오는 중…
          </div>
        )}

        {previewStatus === "error" && (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-xs text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
            미리보기를 불러오지 못했어요.
          </div>
        )}

        {previewStatus === "missing" && (
          <MapMiniPreview ref={miniRef} data={null} emptyText="Preview unavailable" />
        )}

        {previewStatus === "loaded" && (
          <MapMiniPreview ref={miniRef} data={previewData} emptyText="Preview unavailable" />
        )}

        {previewStatus === "idle" && (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
            미리보기를 준비 중이에요.
          </div>
        )}

        {previewStatus === "loaded" && (
          <div className="absolute bottom-3 right-3 flex items-center rounded-full border border-neutral-200 bg-white/90 text-xs font-semibold text-neutral-600 shadow-sm backdrop-blur dark:border-white/12 dark:bg-[#0b1220]/75 dark:text-white/80">
            <button
              type="button"
              onClick={() => miniRef.current?.zoomOut()}
              className="px-2.5 py-1.5 hover:bg-neutral-50 dark:hover:bg-white/10"
              aria-label="Zoom out"
            >
              –
            </button>
            <div className="h-4 w-px bg-neutral-200 dark:bg-white/10" />
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

      <p className="mt-3 text-xs text-neutral-600 line-clamp-2 dark:text-white/70">
        {summary}
      </p>
    </aside>
  );
}
