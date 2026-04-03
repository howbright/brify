"use client";

import { Icon } from "@iconify/react";
import MindElixirMobileControls from "@/components/MindElixirMobileControls";

type MindElixirMobileLayerProps = {
  showMobileControls: boolean;
  editMode: "view" | "edit";
  selectedNodeId: string | null;
  mobileActionNodeId: string | null;
  mobileEditMenuTitle: string;
  mobileEditLabels: {
    addChild: string;
    addSibling: string;
    rename: string;
    remove: string;
    close: string;
  };
  selectedNodeIsRoot: boolean;
  onCloseMobileActions: () => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onRename: () => void;
  onRemove: () => void;
  isFocusMode: boolean;
  selectedRect: DOMRect | null;
  hoverActionWrapClass: string;
  hoverActionButtonClass: string;
  hoverActionIconClass: string;
  handleNoteClick: () => void;
  handleHighlightClick: (id?: string | null) => void;
  showSelectionContextMenuButton: boolean;
  isTouchDevice: boolean;
  moreActionsLabel: string;
  openNodeContextMenu: (nodeId?: string | null, anchorEl?: HTMLElement | null) => void;
  onToggleMobileActionNode: () => void;
  focusModeLabel: string;
  focusModeExitLabel: string;
  onExitFocus: () => void;
  selectedNoteText: string | null;
};

export default function MindElixirMobileLayer({
  showMobileControls,
  editMode,
  selectedNodeId,
  mobileActionNodeId,
  mobileEditMenuTitle,
  mobileEditLabels,
  selectedNodeIsRoot,
  onCloseMobileActions,
  onAddChild,
  onAddSibling,
  onRename,
  onRemove,
  isFocusMode,
  selectedRect,
  hoverActionWrapClass,
  hoverActionButtonClass,
  hoverActionIconClass,
  handleNoteClick,
  handleHighlightClick,
  showSelectionContextMenuButton,
  isTouchDevice,
  moreActionsLabel,
  openNodeContextMenu,
  onToggleMobileActionNode,
  focusModeLabel,
  focusModeExitLabel,
  onExitFocus,
  selectedNoteText,
}: MindElixirMobileLayerProps) {
  return (
    <>
      <MindElixirMobileControls
        showActionBar={
          showMobileControls &&
          editMode === "edit" &&
          !!selectedNodeId &&
          mobileActionNodeId === selectedNodeId
        }
        title={mobileEditMenuTitle}
        labels={mobileEditLabels}
        disableAddSibling={selectedNodeIsRoot}
        disableRename={!selectedNodeId}
        disableRemove={selectedNodeIsRoot}
        onClose={onCloseMobileActions}
        onAddChild={onAddChild}
        onAddSibling={onAddSibling}
        onRename={onRename}
        onRemove={onRemove}
      />

      {!isFocusMode && selectedNodeId && selectedRect && (
        <>
          <div
            className="pointer-events-none absolute z-[19] rounded-md ring-2 ring-blue-500/80 shadow-[0_0_0_3px_rgba(255,255,255,0.92),0_10px_24px_rgba(37,99,235,0.22)] dark:shadow-[0_0_0_3px_rgba(11,18,32,0.9),0_10px_24px_rgba(59,130,246,0.28)]"
            style={{
              left: selectedRect.left - 4,
              top: selectedRect.top - 4,
              width: selectedRect.width + 8,
              height: selectedRect.height + 8,
            }}
          />
          <div
            className="absolute z-20"
            data-hover-actions="true"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{
              left: selectedRect.left + selectedRect.width - 8,
              top: selectedRect.top + selectedRect.height + 8,
              transform: "translate(-100%, 0)",
            }}
          >
            <div className={hoverActionWrapClass}>
              <button
                type="button"
                className={`${hoverActionButtonClass} bg-red-500 text-white ring-1 ring-red-600/60`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNoteClick();
                }}
                aria-label="노트 추가"
              >
                <Icon
                  icon="mdi:note-text-outline"
                  className={hoverActionIconClass}
                />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  노트 추가
                </span>
              </button>
              <button
                type="button"
                className={`${hoverActionButtonClass} bg-yellow-400 text-black ring-1 ring-yellow-500/70`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleHighlightClick(selectedNodeId);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                aria-label="하이라이트"
              >
                <Icon icon="mdi:marker" className={hoverActionIconClass} />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  하이라이트
                </span>
              </button>
              {showMobileControls && editMode === "edit" ? (
                <button
                  type="button"
                  className={`${hoverActionButtonClass} bg-slate-800 text-white ring-1 ring-slate-900/70`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMobileActionNode();
                  }}
                  aria-label={moreActionsLabel}
                >
                  <Icon icon="mdi:dots-horizontal" className={hoverActionIconClass} />
                  <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {moreActionsLabel}
                  </span>
                </button>
              ) : showSelectionContextMenuButton && !isTouchDevice ? (
                <button
                  type="button"
                  className={`${hoverActionButtonClass} bg-slate-800 text-white ring-1 ring-slate-900/70`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openNodeContextMenu(selectedNodeId, e.currentTarget);
                  }}
                  aria-label={moreActionsLabel}
                >
                  <Icon icon="mdi:dots-horizontal" className={hoverActionIconClass} />
                  <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {moreActionsLabel}
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        </>
      )}

      {isFocusMode && (
        <div className="pointer-events-auto absolute right-4 top-16 z-30">
          <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-[11px] text-white shadow-sm">
            <span className="font-medium">{focusModeLabel}</span>
            <button
              type="button"
              className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] text-white hover:bg-white/25"
              onClick={onExitFocus}
            >
              {focusModeExitLabel}
            </button>
          </div>
        </div>
      )}

      {!isFocusMode && selectedRect && selectedNoteText && (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: selectedRect.left + selectedRect.width + 10,
            top: selectedRect.top,
          }}
        >
          <div className="max-w-[260px] rounded-xl border border-blue-200 bg-white/95 px-3 py-2 text-xs text-neutral-700 shadow-lg dark:border-white/10 dark:bg-[#0b1220]/95 dark:text-white/85">
            {selectedNoteText}
          </div>
        </div>
      )}
    </>
  );
}
