"use client";

import type { ReactNode } from "react";
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
  editGroup?: string;
  structureGroup?: string;
  mediaGroup?: string;
  otherGroup?: string;
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
    "flex min-h-[58px] w-full flex-col items-start justify-center gap-1 rounded-xl px-2.5 py-2 text-left text-[12px] font-bold leading-tight transition-colors";
  const sectionTitleClassName =
    "px-1 text-[10px] font-extrabold uppercase tracking-wide text-neutral-400 dark:text-white/38";
  const sectionGridClassName = "grid grid-cols-2 gap-1.5";
  const itemEnabledClassName =
    "bg-neutral-50 text-neutral-950 hover:bg-neutral-100 dark:bg-white/[0.06] dark:text-white/92 dark:hover:bg-white/[0.1]";
  const itemDisabledClassName =
    "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-white/[0.04] dark:text-white/35";
  const iconEnabledClassName = "text-neutral-700 dark:text-white/75";
  const iconDisabledClassName = "text-neutral-400 dark:text-white/35";
  const dangerEnabledClassName =
    "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/18";
  const dangerIconClassName = "text-rose-600 dark:text-rose-200";

  const safeInset = 12;
  const menuWidth = 286;
  const estimatedMenuHeight = 410;
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

  const renderAction = ({
    label,
    icon,
    onClick,
    disabled = false,
    danger = false,
    loading = false,
  }: {
    label: string;
    icon: string;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
    loading?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        baseItemClassName,
        disabled
          ? itemDisabledClassName
          : danger
          ? dangerEnabledClassName
          : itemEnabledClassName,
      ].join(" ")}
    >
      <Icon
        icon={icon}
        className={[
          "h-4.5 w-4.5 shrink-0",
          loading ? "animate-spin" : "",
          disabled
            ? iconDisabledClassName
            : danger
            ? dangerIconClassName
            : iconEnabledClassName,
        ].join(" ")}
      />
      <span className="line-clamp-2 min-w-0 break-keep">{label}</span>
    </button>
  );

  const renderSection = (title: string, children: ReactNode) => (
    <section className="space-y-1.5">
      <div className={sectionTitleClassName}>{title}</div>
      <div className={sectionGridClassName}>{children}</div>
    </section>
  );

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
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
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
            <div
              className="flex max-h-[calc(100%-2rem)] flex-col gap-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]"
              style={{ scrollbarColor: "rgba(148, 163, 184, 0.65) transparent" }}
            >
              {renderSection(labels.editGroup ?? "Edit", (
                <>
                  {renderAction({
                    label: labels.addChild,
                    icon: "mdi:plus-circle-outline",
                    onClick: onAddChild,
                  })}
                  {renderAction({
                    label: labels.rename,
                    icon: "mdi:pencil-outline",
                    onClick: onRename,
                    disabled: disableRename,
                  })}
                  {renderAction({
                    label: labels.editContent,
                    icon: "mdi:format-text",
                    onClick: onEditContent,
                    disabled: disableEditContent,
                  })}
                  {renderAction({
                    label: labels.addParent,
                    icon: "mdi:transit-connection-horizontal",
                    onClick: onAddParent,
                    disabled: disableAddParent,
                  })}
                  {renderAction({
                    label: labels.addSibling,
                    icon: "mdi:relation-many-to-many",
                    onClick: _onAddSibling,
                    disabled: _disableAddSibling,
                  })}
                </>
              ))}

              {renderSection(labels.structureGroup ?? "Structure", (
                <>
                  {renderAction({
                    label: labels.regenerate,
                    icon: regenerating ? "mdi:loading" : "mdi:auto-fix",
                    onClick: onRegenerate,
                    disabled: disableRegenerate || regenerating,
                    loading: regenerating,
                  })}
                  {renderAction({
                    label: labels.linkBidirectional,
                    icon: "mdi:vector-polyline-plus",
                    onClick: onLinkBidirectional,
                  })}
                </>
              ))}

              {renderSection(labels.mediaGroup ?? "Media", (
                <>
                  {renderAction({
                    label: labels.addOrReplaceImage,
                    icon: "mdi:image-plus-outline",
                    onClick: onAddOrReplaceImage,
                    disabled: disableImageActions,
                  })}
                  {renderAction({
                    label: labels.removeImage,
                    icon: "mdi:image-remove-outline",
                    onClick: onRemoveImage,
                    disabled: disableImageActions,
                  })}
                </>
              ))}

              {renderSection(labels.otherGroup ?? "Other", (
                <>
                  {renderAction({
                    label: labels.slideshow,
                    icon: "mdi:presentation-play",
                    onClick: onSlideshow,
                  })}
                  {renderAction({
                    label: labels.remove,
                    icon: "mdi:trash-can-outline",
                    onClick: onRemove,
                    disabled: disableRemove,
                    danger: true,
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
