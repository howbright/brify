"use client";

import { Icon } from "@iconify/react";

type Labels = {
  addChild: string;
  addSibling: string;
  rename: string;
  remove: string;
};

type Props = {
  showActionBar: boolean;
  labels: Labels;
  title?: string;
  anchorRect?: DOMRect | null;
  disableAddSibling?: boolean;
  disableRename?: boolean;
  disableRemove?: boolean;
  onClose?: () => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onRename: () => void;
  onRemove: () => void;
};

export default function MindElixirMobileControls({
  showActionBar,
  labels,
  title = "Edit menu",
  anchorRect,
  disableAddSibling: _disableAddSibling = false,
  disableRename = false,
  disableRemove = false,
  onClose,
  onAddChild,
  onAddSibling: _onAddSibling,
  onRename,
  onRemove,
}: Props) {
  const baseItemClassName =
    "flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left text-[14px] font-semibold transition-colors";

  const menuWidth = 184;
  const menuLeft =
    anchorRect && typeof window !== "undefined"
      ? Math.max(
          12,
          Math.min(anchorRect.left + anchorRect.width - menuWidth, window.innerWidth - menuWidth - 12)
        )
      : 12;
  const menuTop =
    anchorRect && typeof window !== "undefined"
      ? Math.max(12, anchorRect.top + anchorRect.height + 10)
      : 12;

  return (
    <>
      {showActionBar && (
        <div className="pointer-events-none absolute inset-0 z-30">
          <button
            type="button"
            aria-label="Close menu"
            className="pointer-events-auto absolute inset-0 bg-transparent"
            onClick={onClose}
          />
          <div
            className="pointer-events-auto absolute rounded-2xl border border-neutral-200/90 bg-white/98 p-2 shadow-[0_18px_42px_-22px_rgba(15,23,42,0.38)] backdrop-blur dark:border-white/12 dark:bg-[#0b1220]/96"
            style={{
              width: menuWidth,
              left: menuLeft,
              top: menuTop,
            }}
          >
            <div className="mb-1 flex items-center justify-between px-1">
              <div className="text-[12px] font-medium text-neutral-500 dark:text-white/55">
                {title}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close menu"
              >
                <Icon icon="mdi:close" className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onAddChild}
                className={`${baseItemClassName} bg-neutral-50 text-neutral-950 hover:bg-neutral-100 dark:bg-white/[0.06] dark:text-white/92 dark:hover:bg-white/[0.1]`}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon
                    icon="mdi:plus-circle-outline"
                    className="h-4.5 w-4.5 shrink-0 text-neutral-700 dark:text-white/75"
                  />
                  <span>{labels.addChild}</span>
                </span>
                <Icon
                  icon="mdi:chevron-right"
                  className="h-4.5 w-4.5 shrink-0 text-neutral-400"
                />
              </button>
              <button
                type="button"
                onClick={onRename}
                disabled={disableRename}
                className={[
                  baseItemClassName,
                  disableRename
                    ? "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-white/[0.04] dark:text-white/35"
                    : "bg-neutral-50 text-neutral-950 hover:bg-neutral-100 dark:bg-white/[0.06] dark:text-white/92 dark:hover:bg-white/[0.1]",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon
                    icon="mdi:pencil-outline"
                    className={[
                      "h-4.5 w-4.5 shrink-0",
                      disableRename ? "text-neutral-400 dark:text-white/35" : "text-neutral-700 dark:text-white/75",
                    ].join(" ")}
                  />
                  <span>{labels.rename}</span>
                </span>
                <Icon
                  icon="mdi:chevron-right"
                  className="h-4.5 w-4.5 shrink-0 text-neutral-400"
                />
              </button>
              <button
                type="button"
                onClick={onRemove}
                disabled={disableRemove}
                className={[
                  baseItemClassName,
                  disableRemove
                    ? "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-white/[0.04] dark:text-white/35"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/18",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon
                    icon="mdi:trash-can-outline"
                    className={[
                      "h-4.5 w-4.5 shrink-0",
                      disableRemove ? "text-neutral-400 dark:text-white/35" : "text-rose-600 dark:text-rose-200",
                    ].join(" ")}
                  />
                  <span>{labels.remove}</span>
                </span>
                <Icon
                  icon="mdi:chevron-right"
                  className="h-4.5 w-4.5 shrink-0 text-neutral-400"
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
