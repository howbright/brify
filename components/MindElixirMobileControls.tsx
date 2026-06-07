"use client";

import { Icon } from "@iconify/react";

type Labels = {
  addChild: string;
  addParent: string;
  addSibling: string;
  rename: string;
  editContent: string;
  slideshow: string;
  regenerate: string;
  linkBidirectional: string;
  addOrReplaceImage: string;
  removeImage: string;
  remove: string;
};

type Props = {
  showActionBar: boolean;
  labels: Labels;
  title?: string;
  anchorRect?: DOMRect | null;
  disableAddParent?: boolean;
  disableAddSibling?: boolean;
  disableRename?: boolean;
  disableEditContent?: boolean;
  disableRegenerate?: boolean;
  disableImageActions?: boolean;
  disableRemove?: boolean;
  regenerating?: boolean;
  onClose?: () => void;
  onAddChild: () => void;
  onAddParent: () => void;
  onAddSibling: () => void;
  onRename: () => void;
  onEditContent: () => void;
  onRegenerate: () => void;
  onSlideshow: () => void;
  onLinkBidirectional: () => void;
  onAddOrReplaceImage: () => void;
  onRemoveImage: () => void;
  onRemove: () => void;
};

export default function MindElixirMobileControls({
  showActionBar,
  labels,
  title = "Edit menu",
  anchorRect,
  disableAddParent = false,
  disableAddSibling: _disableAddSibling = false,
  disableRename = false,
  disableEditContent = false,
  disableRegenerate = false,
  disableImageActions = false,
  disableRemove = false,
  regenerating = false,
  onClose,
  onAddChild,
  onAddParent,
  onAddSibling: _onAddSibling,
  onRename,
  onEditContent,
  onRegenerate,
  onSlideshow,
  onLinkBidirectional,
  onAddOrReplaceImage,
  onRemoveImage,
  onRemove,
}: Props) {
  const baseItemClassName =
    "flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left text-[14px] font-semibold transition-colors";

  const safeInset = 12;
  const menuWidth = 184;
  const estimatedMenuHeight = 420;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;
  const menuLeft =
    anchorRect && viewportWidth > 0
      ? Math.max(
          safeInset,
          Math.min(
            anchorRect.left + anchorRect.width - menuWidth,
            viewportWidth - menuWidth - safeInset
          )
        )
      : safeInset;
  const menuMaxHeight = viewportHeight
    ? Math.min(estimatedMenuHeight, Math.max(220, viewportHeight - safeInset * 2))
    : estimatedMenuHeight;
  const spaceBelow =
    anchorRect && viewportHeight > 0
      ? viewportHeight - (anchorRect.top + anchorRect.height) - safeInset
      : viewportHeight - safeInset * 2;
  const spaceAbove =
    anchorRect && viewportHeight > 0 ? anchorRect.top - safeInset : 0;
  const shouldOpenAbove =
    Boolean(anchorRect) &&
    spaceBelow < Math.min(estimatedMenuHeight, menuMaxHeight) &&
    spaceAbove > spaceBelow;
  const preferredTop =
    anchorRect && viewportHeight > 0
      ? shouldOpenAbove
        ? anchorRect.top - Math.min(menuMaxHeight, estimatedMenuHeight) - 10
        : anchorRect.top + anchorRect.height + 10
      : safeInset;
  const menuTop = viewportHeight
    ? Math.min(
        Math.max(safeInset, preferredTop),
        Math.max(safeInset, viewportHeight - menuMaxHeight - safeInset)
      )
    : safeInset;

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
            className="pointer-events-auto absolute overflow-hidden rounded-2xl border border-neutral-200/90 bg-white/98 p-2 shadow-[0_18px_42px_-22px_rgba(15,23,42,0.38)] backdrop-blur dark:border-white/12 dark:bg-[#0b1220]/96"
            style={{
              width: menuWidth,
              left: menuLeft,
              top: menuTop,
              maxHeight: menuMaxHeight,
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
            <div className="flex max-h-[calc(100%-2rem)] flex-col gap-2 overflow-y-auto pr-0.5">
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
                onClick={onAddParent}
                disabled={disableAddParent}
                className={[
                  baseItemClassName,
                  disableAddParent
                    ? "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-white/[0.04] dark:text-white/35"
                    : "bg-neutral-50 text-neutral-950 hover:bg-neutral-100 dark:bg-white/[0.06] dark:text-white/92 dark:hover:bg-white/[0.1]",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon
                    icon="mdi:transit-connection-horizontal"
                    className={[
                      "h-4.5 w-4.5 shrink-0",
                      disableAddParent ? "text-neutral-400 dark:text-white/35" : "text-neutral-700 dark:text-white/75",
                    ].join(" ")}
                  />
                  <span>{labels.addParent}</span>
                </span>
                <Icon
                  icon="mdi:chevron-right"
                  className="h-4.5 w-4.5 shrink-0 text-neutral-400"
                />
              </button>
              <button
                type="button"
                onClick={_onAddSibling}
                disabled={_disableAddSibling}
                className={[
                  baseItemClassName,
                  _disableAddSibling
                    ? "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-white/[0.04] dark:text-white/35"
                    : "bg-neutral-50 text-neutral-950 hover:bg-neutral-100 dark:bg-white/[0.06] dark:text-white/92 dark:hover:bg-white/[0.1]",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon
                    icon="mdi:relation-many-to-many"
                    className={[
                      "h-4.5 w-4.5 shrink-0",
                      _disableAddSibling ? "text-neutral-400 dark:text-white/35" : "text-neutral-700 dark:text-white/75",
                    ].join(" ")}
                  />
                  <span>{labels.addSibling}</span>
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
                onClick={onEditContent}
                disabled={disableEditContent}
                className={[
                  baseItemClassName,
                  disableEditContent
                    ? "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-white/[0.04] dark:text-white/35"
                    : "bg-neutral-50 text-neutral-950 hover:bg-neutral-100 dark:bg-white/[0.06] dark:text-white/92 dark:hover:bg-white/[0.1]",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon
                    icon="mdi:format-text"
                    className={[
                      "h-4.5 w-4.5 shrink-0",
                      disableEditContent
                        ? "text-neutral-400 dark:text-white/35"
                        : "text-neutral-700 dark:text-white/75",
                    ].join(" ")}
                  />
                  <span>{labels.editContent}</span>
                </span>
                <Icon
                  icon="mdi:chevron-right"
                  className="h-4.5 w-4.5 shrink-0 text-neutral-400"
                />
              </button>
              <button
                type="button"
                onClick={onSlideshow}
                className={`${baseItemClassName} bg-neutral-50 text-neutral-950 hover:bg-neutral-100 dark:bg-white/[0.06] dark:text-white/92 dark:hover:bg-white/[0.1]`}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon
                    icon="mdi:presentation-play"
                    className="h-4.5 w-4.5 shrink-0 text-neutral-700 dark:text-white/75"
                  />
                  <span>{labels.slideshow}</span>
                </span>
                <Icon
                  icon="mdi:chevron-right"
                  className="h-4.5 w-4.5 shrink-0 text-neutral-400"
                />
              </button>
              <button
                type="button"
                onClick={onRegenerate}
                disabled={disableRegenerate || regenerating}
                className={[
                  baseItemClassName,
                  disableRegenerate || regenerating
                    ? "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-white/[0.04] dark:text-white/35"
                    : "bg-neutral-50 text-neutral-950 hover:bg-neutral-100 dark:bg-white/[0.06] dark:text-white/92 dark:hover:bg-white/[0.1]",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon
                    icon={regenerating ? "mdi:loading" : "mdi:auto-fix"}
                    className={[
                      "h-4.5 w-4.5 shrink-0",
                      regenerating ? "animate-spin" : "",
                      disableRegenerate || regenerating
                        ? "text-neutral-400 dark:text-white/35"
                        : "text-neutral-700 dark:text-white/75",
                    ].join(" ")}
                  />
                  <span>{labels.regenerate}</span>
                </span>
                <Icon
                  icon="mdi:chevron-right"
                  className="h-4.5 w-4.5 shrink-0 text-neutral-400"
                />
              </button>
              <button
                type="button"
                onClick={onLinkBidirectional}
                className={`${baseItemClassName} bg-neutral-50 text-neutral-950 hover:bg-neutral-100 dark:bg-white/[0.06] dark:text-white/92 dark:hover:bg-white/[0.1]`}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon
                    icon="mdi:vector-polyline-plus"
                    className="h-4.5 w-4.5 shrink-0 text-neutral-700 dark:text-white/75"
                  />
                  <span>{labels.linkBidirectional}</span>
                </span>
                <Icon
                  icon="mdi:chevron-right"
                  className="h-4.5 w-4.5 shrink-0 text-neutral-400"
                />
              </button>
              <button
                type="button"
                onClick={onAddOrReplaceImage}
                disabled={disableImageActions}
                className={[
                  baseItemClassName,
                  disableImageActions
                    ? "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-white/[0.04] dark:text-white/35"
                    : "bg-neutral-50 text-neutral-950 hover:bg-neutral-100 dark:bg-white/[0.06] dark:text-white/92 dark:hover:bg-white/[0.1]",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon
                    icon="mdi:image-plus-outline"
                    className={[
                      "h-4.5 w-4.5 shrink-0",
                      disableImageActions ? "text-neutral-400 dark:text-white/35" : "text-neutral-700 dark:text-white/75",
                    ].join(" ")}
                  />
                  <span>{labels.addOrReplaceImage}</span>
                </span>
                <Icon
                  icon="mdi:chevron-right"
                  className="h-4.5 w-4.5 shrink-0 text-neutral-400"
                />
              </button>
              <button
                type="button"
                onClick={onRemoveImage}
                disabled={disableImageActions}
                className={[
                  baseItemClassName,
                  disableImageActions
                    ? "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-white/[0.04] dark:text-white/35"
                    : "bg-neutral-50 text-neutral-950 hover:bg-neutral-100 dark:bg-white/[0.06] dark:text-white/92 dark:hover:bg-white/[0.1]",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon
                    icon="mdi:image-remove-outline"
                    className={[
                      "h-4.5 w-4.5 shrink-0",
                      disableImageActions ? "text-neutral-400 dark:text-white/35" : "text-neutral-700 dark:text-white/75",
                    ].join(" ")}
                  />
                  <span>{labels.removeImage}</span>
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
