"use client";

import { Icon } from "@iconify/react";

type Labels = {
  pan: string;
  select: string;
  addChild: string;
  addSibling: string;
  rename: string;
  remove: string;
};

type Props = {
  showModeToggle: boolean;
  showActionBar: boolean;
  effectivePanMode: boolean;
  labels: Labels;
  disableAddSibling?: boolean;
  disableRename?: boolean;
  disableRemove?: boolean;
  onSelectPanMode: (enabled: boolean) => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onRename: () => void;
  onRemove: () => void;
};

export default function MindElixirMobileControls({
  showModeToggle,
  showActionBar,
  effectivePanMode,
  labels,
  disableAddSibling = false,
  disableRename = false,
  disableRemove = false,
  onSelectPanMode,
  onAddChild,
  onAddSibling,
  onRename,
  onRemove,
}: Props) {
  return (
    <>
      {showModeToggle && (
        <div className="pointer-events-auto absolute bottom-4 left-4 z-20">
          <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white/92 p-1 shadow-lg dark:border-white/15 dark:bg-[#0b1220]/90">
            <button
              type="button"
              onClick={() => onSelectPanMode(true)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                effectivePanMode
                  ? "bg-blue-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-white/70 dark:hover:bg-white/8",
              ].join(" ")}
              aria-pressed={effectivePanMode}
            >
              <Icon icon="mdi:hand-back-left" className="h-3.5 w-3.5" />
              {labels.pan}
            </button>
            <button
              type="button"
              onClick={() => onSelectPanMode(false)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                !effectivePanMode
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-white/70 dark:hover:bg-white/8",
              ].join(" ")}
              aria-pressed={!effectivePanMode}
            >
              <Icon
                icon="mdi:cursor-default-click-outline"
                className="h-3.5 w-3.5"
              />
              {labels.select}
            </button>
          </div>
        </div>
      )}

      {showActionBar && (
        <div className="pointer-events-auto absolute inset-x-4 bottom-20 z-30">
          <div className="mx-auto flex max-w-md items-center justify-between gap-2 rounded-[22px] border border-neutral-200 bg-white/95 p-2 shadow-[0_22px_48px_-28px_rgba(15,23,42,0.42)] dark:border-white/15 dark:bg-[#0b1220]/94 dark:shadow-[0_22px_48px_-28px_rgba(2,6,23,0.9)]">
            <button
              type="button"
              onClick={onAddChild}
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-3 py-3 text-[11px] font-semibold text-white"
            >
              <Icon
                icon="mdi:plus-circle-outline"
                className="h-4 w-4 shrink-0"
              />
              <span className="truncate">{labels.addChild}</span>
            </button>
            <button
              type="button"
              onClick={onAddSibling}
              disabled={disableAddSibling}
              className={[
                "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-[11px] font-semibold",
                disableAddSibling
                  ? "cursor-not-allowed bg-emerald-300 text-white/80 dark:bg-emerald-900/60"
                  : "bg-emerald-600 text-white",
              ].join(" ")}
            >
              <Icon icon="mdi:graph-outline" className="h-4 w-4 shrink-0" />
              <span className="truncate">{labels.addSibling}</span>
            </button>
            <button
              type="button"
              onClick={onRename}
              disabled={disableRename}
              className={[
                "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-[11px] font-semibold",
                disableRename
                  ? "cursor-not-allowed bg-amber-200 text-slate-500 dark:bg-amber-900/50 dark:text-white/55"
                  : "bg-amber-500 text-slate-950",
              ].join(" ")}
            >
              <Icon icon="mdi:pencil-outline" className="h-4 w-4 shrink-0" />
              <span className="truncate">{labels.rename}</span>
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={disableRemove}
              className={[
                "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-[11px] font-semibold",
                disableRemove
                  ? "cursor-not-allowed bg-rose-300 text-white/80 dark:bg-rose-900/60"
                  : "bg-rose-500 text-white",
              ].join(" ")}
            >
              <Icon
                icon="mdi:trash-can-outline"
                className="h-4 w-4 shrink-0"
              />
              <span className="truncate">{labels.remove}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
