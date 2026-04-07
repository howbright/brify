"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react";
import MindElixirMobileControls from "@/components/MindElixirMobileControls";

function normalizeNodeId(id: string | null) {
  if (!id) return null;
  return id.startsWith("me") ? id.slice(2) : id;
}

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
  noteActionLabel: string;
  highlightActionLabel: string;
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
  noteActionLabel,
  highlightActionLabel,
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
  const selectedNormalized = normalizeNodeId(selectedNodeId);
  const mobileActionNormalized = normalizeNodeId(mobileActionNodeId);
  const actionTargetNodeId = mobileActionNodeId ?? selectedNodeId;
  const showActionBar =
    showMobileControls &&
    editMode === "edit" &&
    !!mobileActionNodeId &&
    (!!selectedNodeId ? mobileActionNormalized === selectedNormalized : true);
  const hoverRect = !isFocusMode && selectedNodeId && selectedRect ? selectedRect : null;
  const showHoverActions = Boolean(hoverRect);

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/b44aa14f-cb62-41f5-bd7a-02a25686b9d0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: "mobile-layer",
        hypothesisId: "H4",
        location: "components/MindElixirMobileLayer.tsx:90",
        message: "mobile layer visibility snapshot",
        data: {
          selectedNodeId: selectedNormalized,
          mobileActionNodeId: mobileActionNormalized,
          actionTargetNodeId: normalizeNodeId(actionTargetNodeId),
          showActionBar,
          showHoverActions,
          hasSelectedRect: Boolean(selectedRect),
          showMobileControls,
          editMode,
          isFocusMode,
          disableAddSibling: selectedNodeIsRoot,
          disableRename: !actionTargetNodeId,
          disableRemove: selectedNodeIsRoot,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [
    editMode,
    isFocusMode,
    mobileActionNormalized,
    selectedNormalized,
    selectedRect,
    showActionBar,
    showHoverActions,
    showMobileControls,
  ]);

  return (
    <>
      <MindElixirMobileControls
        showActionBar={showActionBar}
        title={mobileEditMenuTitle}
        labels={mobileEditLabels}
        disableAddSibling={selectedNodeIsRoot}
        disableRename={!actionTargetNodeId}
        disableRemove={selectedNodeIsRoot}
        onClose={onCloseMobileActions}
        onAddChild={onAddChild}
        onAddSibling={onAddSibling}
        onRename={onRename}
        onRemove={onRemove}
      />

      {hoverRect && (
        <>
          <div
            className="pointer-events-none absolute z-[19] rounded-md ring-2 ring-blue-500/80 shadow-[0_0_0_3px_rgba(255,255,255,0.92),0_10px_24px_rgba(37,99,235,0.22)] dark:shadow-[0_0_0_3px_rgba(11,18,32,0.9),0_10px_24px_rgba(59,130,246,0.28)]"
            style={{
              left: hoverRect.left - 4,
              top: hoverRect.top - 4,
              width: hoverRect.width + 8,
              height: hoverRect.height + 8,
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
              left: hoverRect.left + hoverRect.width - 8,
              top: hoverRect.top + hoverRect.height + 8,
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
                aria-label={noteActionLabel}
              >
                <Icon
                  icon="mdi:note-text-outline"
                  className={hoverActionIconClass}
                />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  {noteActionLabel}
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
                aria-label={highlightActionLabel}
              >
                <Icon icon="mdi:marker" className={hoverActionIconClass} />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  {highlightActionLabel}
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
