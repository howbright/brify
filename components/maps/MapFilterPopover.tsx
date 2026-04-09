"use client";

import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";

type SourceType = "youtube" | "website" | "file" | "manual";
type ContentFilter = "notes" | "terms";

const DATE_PRESETS = [
  { id: "7d", labelKey: "presets.7d" },
  { id: "30d", labelKey: "presets.30d" },
  { id: "90d", labelKey: "presets.90d" },
  { id: "1y", labelKey: "presets.1y" },
  { id: "all", labelKey: "presets.all" },
] as const;

type MapFilterPopoverProps = {
  datePreset: string;
  onDatePresetChange: (value: string) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  statusFilters: MapJobStatus[];
  onToggleStatus: (value: MapJobStatus) => void;
  sourceFilters: SourceType[];
  onToggleSource: (value: SourceType) => void;
  contentFilters: ContentFilter[];
  onToggleContent: (value: ContentFilter) => void;
  tagFilters: string[];
  tagOptions: Array<{ name: string; count: number }>;
  tagsLoading: boolean;
  onToggleTag: (value: string) => void;
  showTagFilters?: boolean;
  onClose: () => void;
  anchorRect?: DOMRect | null;
};

export default function MapFilterPopover({
  datePreset,
  onDatePresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  statusFilters,
  onToggleStatus,
  sourceFilters,
  onToggleSource,
  contentFilters,
  onToggleContent,
  tagFilters,
  tagOptions,
  tagsLoading,
  onToggleTag,
  showTagFilters = true,
  onClose,
  anchorRect,
}: MapFilterPopoverProps) {
  const t = useTranslations("MapsCommon.filterPopover");
  if (typeof document === "undefined") return null;

  const desktopWidth =
    typeof window !== "undefined" ? Math.min(560, window.innerWidth * 0.9) : 560;
  const desktopLeft =
    anchorRect && typeof window !== "undefined"
      ? Math.max(
          16,
          Math.min(anchorRect.right - desktopWidth, window.innerWidth - desktopWidth - 16)
        )
      : undefined;
  const desktopTop = anchorRect ? anchorRect.bottom + 8 : undefined;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[80] md:top-[140px]"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-4 top-[140px] z-[90] mt-2 w-auto max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-400 bg-white p-4 text-xs text-neutral-700 shadow-lg dark:border-white/20 dark:bg-[#0b1220]/95 dark:text-white/80 md:inset-x-auto md:mt-0 md:max-h-[60vh]"
        style={
          typeof window !== "undefined" && window.innerWidth >= 768
            ? {
                width: desktopWidth,
                left: desktopLeft,
                top: desktopTop,
              }
            : undefined
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-neutral-800 dark:text-white">
              {t("sections.date")}
            </div>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onDatePresetChange(preset.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    datePreset === preset.id
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-slate-400 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-white/20 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/10"
                  }`}
                >
                  {t(preset.labelKey)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onDatePresetChange("custom")}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  datePreset === "custom"
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-slate-400 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-white/20 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/10"
                }`}
              >
                {t("custom")}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <input
                type="date"
                value={customFrom}
                onChange={(event) => onCustomFromChange(event.target.value)}
                className="rounded-full border border-slate-400 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80"
              />
              <span className="text-neutral-400">~</span>
              <input
                type="date"
                value={customTo}
                onChange={(event) => onCustomToChange(event.target.value)}
                className="rounded-full border border-slate-400 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-semibold text-neutral-800 dark:text-white">
              {t("sections.status")}
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "processing", label: t("status.processing") },
                  { id: "done", label: t("status.done") },
                  { id: "failed", label: t("status.failed") },
                ] as const
              ).map((item) => (
                <label
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-400 bg-white px-3 py-1 text-xs text-neutral-600 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={statusFilters.includes(item.id)}
                    onChange={() => onToggleStatus(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-semibold text-neutral-800 dark:text-white">
              {t("sections.source")}
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "youtube", label: t("source.youtube") },
                  { id: "website", label: t("source.website") },
                  { id: "file", label: t("source.file") },
                  { id: "manual", label: t("source.manual") },
                ] as const
              ).map((item) => (
                <label
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-400 bg-white px-3 py-1 text-xs text-neutral-600 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={sourceFilters.includes(item.id)}
                    onChange={() => onToggleSource(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-semibold text-neutral-800 dark:text-white">
              {t("sections.content")}
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "notes", label: t("content.notes") },
                  { id: "terms", label: t("content.terms") },
                ] as const
              ).map((item) => (
                <label
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-400 bg-white px-3 py-1 text-xs text-neutral-600 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80"
                >
                  <input
                    type="checkbox"
                    checked={contentFilters.includes(item.id)}
                    onChange={() => onToggleContent(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          {showTagFilters && (
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-neutral-800 dark:text-white">
                {t("sections.tag")}
              </div>
              {tagsLoading ? (
                <div className="text-neutral-500 dark:text-white/60">
                  {t("tagLoading")}
                </div>
              ) : tagOptions.length === 0 ? (
                <div className="text-neutral-500 dark:text-white/60">
                  {t("tagEmpty")}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((tag) => (
                    <label
                      key={tag.name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-400 bg-white px-3 py-1 text-xs text-neutral-600 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80"
                    >
                      <input
                        type="checkbox"
                        checked={tagFilters.includes(tag.name)}
                        onChange={() => onToggleTag(tag.name)}
                      />
                      #{tag.name}
                      <span className="text-[10px] text-neutral-400">
                        {tag.count}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
