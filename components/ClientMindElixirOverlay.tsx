"use client";

import { Icon } from "@iconify/react";
import MindElixirMobileControls from "@/components/MindElixirMobileControls";
import MindElixirMiniMap from "@/components/MindElixirMiniMap";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type ClientMindElixirOverlayProps = {
  elRef: React.RefObject<HTMLDivElement | null>;
  effectivePanMode: boolean;
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
  showMiniMap: boolean;
  isTouchDevice: boolean;
  miniMapLabel: string;
  miniMapCenterLabel: string;
  miniMapZoomInLabel: string;
  miniMapZoomOutLabel: string;
  miniMapCollapseLevelLabel: string;
  miniMapExpandLevelLabel: string;
  miniMapRef: React.RefObject<HTMLCanvasElement | null>;
  onMiniMapCenter: () => void;
  onMiniMapZoomIn: () => void;
  onMiniMapZoomOut: () => void;
  onMiniMapCollapseLevel: () => void;
  onMiniMapExpandLevel: () => void;
  isFocusMode: boolean;
  selectedRect: DOMRect | null;
  hoverActionWrapClass: string;
  hoverActionButtonClass: string;
  hoverActionIconClass: string;
  onNoteClick: () => void;
  onHighlightClick: () => void;
  moreActionsLabel: string;
  showSelectionContextMenuButton: boolean;
  onToggleMobileActionNode: () => void;
  onOpenSelectionContextMenu: (anchorEl: HTMLElement) => void;
  focusModeLabel: string;
  focusModeExitLabel: string;
  onExitFocus: () => void;
  selectedNoteText: string | null;
  noteEditorOpen: boolean;
  onNoteEditorOpenChange: (open: boolean) => void;
  noteDraft: string;
  onNoteDraftChange: (value: string) => void;
  onDeleteNote: () => void;
  onSaveNote: () => void;
  loading: boolean;
  ready: boolean;
};

export default function ClientMindElixirOverlay({
  elRef,
  effectivePanMode,
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
  showMiniMap,
  isTouchDevice,
  miniMapLabel,
  miniMapCenterLabel,
  miniMapZoomInLabel,
  miniMapZoomOutLabel,
  miniMapCollapseLevelLabel,
  miniMapExpandLevelLabel,
  miniMapRef,
  onMiniMapCenter,
  onMiniMapZoomIn,
  onMiniMapZoomOut,
  onMiniMapCollapseLevel,
  onMiniMapExpandLevel,
  isFocusMode,
  selectedRect,
  hoverActionWrapClass,
  hoverActionButtonClass,
  hoverActionIconClass,
  onNoteClick,
  onHighlightClick,
  moreActionsLabel,
  showSelectionContextMenuButton,
  onToggleMobileActionNode,
  onOpenSelectionContextMenu,
  focusModeLabel,
  focusModeExitLabel,
  onExitFocus,
  selectedNoteText,
  noteEditorOpen,
  onNoteEditorOpenChange,
  noteDraft,
  onNoteDraftChange,
  onDeleteNote,
  onSaveNote,
  loading,
  ready,
}: ClientMindElixirOverlayProps) {
  return (
    <>
      <div
        ref={elRef}
        className="relative h-full w-full"
        style={{ touchAction: effectivePanMode ? "none" : undefined }}
      />

      <MindElixirMobileControls
        showActionBar={
          showMobileControls &&
          editMode === "edit" &&
          !!selectedNodeId &&
          mobileActionNodeId === selectedNodeId
        }
        title={mobileEditMenuTitle}
        labels={mobileEditLabels}
        anchorRect={selectedRect}
        disableAddSibling={selectedNodeIsRoot}
        disableRename={!selectedNodeId}
        disableRemove={selectedNodeIsRoot}
        onClose={onCloseMobileActions}
        onAddChild={onAddChild}
        onAddSibling={onAddSibling}
        onRename={onRename}
        onRemove={onRemove}
      />

      <MindElixirMiniMap
        show={showMiniMap && !isTouchDevice}
        label={miniMapLabel}
        canvasRef={miniMapRef}
        centerLabel={miniMapCenterLabel}
        zoomInLabel={miniMapZoomInLabel}
        zoomOutLabel={miniMapZoomOutLabel}
        collapseLevelLabel={miniMapCollapseLevelLabel}
        expandLevelLabel={miniMapExpandLevelLabel}
        onCenter={onMiniMapCenter}
        onZoomIn={onMiniMapZoomIn}
        onZoomOut={onMiniMapZoomOut}
        onCollapseLevel={onMiniMapCollapseLevel}
        onExpandLevel={onMiniMapExpandLevel}
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
                  onNoteClick();
                }}
                aria-label="노트 추가"
              >
                <Icon icon="mdi:note-text-outline" className={hoverActionIconClass} />
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
                  onHighlightClick();
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
                    onOpenSelectionContextMenu(e.currentTarget);
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

      <Dialog open={noteEditorOpen} onOpenChange={onNoteEditorOpenChange}>
        <DialogContent className="max-w-[420px]">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-200">
                노트
              </h3>
            </div>

            <textarea
              className="min-h-[120px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60 dark:border-white/10 dark:bg-[#0b1220] dark:text-white/85 dark:focus:border-blue-300 dark:focus:ring-blue-500/30"
              placeholder="노트를 입력하세요"
              value={noteDraft}
              onChange={(e) => onNoteDraftChange(e.target.value.slice(0, 500))}
              maxLength={500}
            />

            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-white/60">
              <span>{noteDraft.length}/500</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
                  onClick={onDeleteNote}
                >
                  노트 삭제
                </button>
                <button
                  type="button"
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/10"
                  onClick={() => onNoteEditorOpenChange(false)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                  onClick={onSaveNote}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="pointer-events-none absolute left-4 top-4 z-10">
          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] text-neutral-600 shadow-sm dark:bg-[#0b1220]/80 dark:text-white/70">
            구조맵 불러오는 중…
          </span>
        </div>
      )}

      {!ready && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="h-full w-full animate-pulse bg-black/5 dark:bg-white/5" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-6 top-6 h-3 w-40 rounded bg-black/10 dark:bg-white/10" />
            <div className="absolute left-6 top-12 h-3 w-28 rounded bg-black/10 dark:bg-white/10" />
            <div className="absolute left-10 top-24 h-24 w-56 rounded-xl bg-black/10 dark:bg-white/10" />
            <div className="absolute right-10 bottom-10 h-20 w-44 rounded-xl bg-black/10 dark:bg-white/10" />
          </div>
        </div>
      )}
    </>
  );
}
