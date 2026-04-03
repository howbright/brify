"use client";

import { createPortal } from "react-dom";
import type { MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";

type SourceType = "youtube" | "website" | "file" | "manual";

const DATE_PRESETS = [
  { id: "7d", label: "지난 7일" },
  { id: "30d", label: "지난 30일" },
  { id: "90d", label: "지난 90일" },
  { id: "1y", label: "지난 1년" },
  { id: "all", label: "전체" },
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
  tagFilters,
  tagOptions,
  tagsLoading,
  onToggleTag,
  showTagFilters = true,
  onClose,
  anchorRect,
}: MapFilterPopoverProps) {
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
              기간
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
                  {preset.label}
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
                직접 선택
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
              상태
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "processing", label: "진행중" },
                  { id: "done", label: "완료" },
                  { id: "failed", label: "실패" },
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
              소스 타입
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "youtube", label: "유튜브" },
                  { id: "website", label: "웹" },
                  { id: "file", label: "파일" },
                  { id: "manual", label: "수동" },
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

          {showTagFilters && (
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-neutral-800 dark:text-white">
                태그
              </div>
              {tagsLoading ? (
                <div className="text-neutral-500 dark:text-white/60">
                  태그 불러오는 중…
                </div>
              ) : tagOptions.length === 0 ? (
                <div className="text-neutral-500 dark:text-white/60">
                  사용할 수 있는 태그가 없어요.
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
