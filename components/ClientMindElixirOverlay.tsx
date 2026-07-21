"use client";

import type { CSSProperties } from "react";
import { Icon } from "@iconify/react";
import MindElixirMobileControls from "@/components/MindElixirMobileControls";
import MindElixirMiniMap from "@/components/MindElixirMiniMap";

const NODE_NOTE_MAX_LENGTH = 1000;

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
    close: string;
  };
  selectedNodeIsRoot: boolean;
  disableRename: boolean;
  disableImageActions: boolean;
  disableEditContent: boolean;
  disableRegenerate: boolean;
  regenerating: boolean;
  onCloseMobileActions: () => void;
  onAddChild: () => void;
  onAddParent: () => void;
  onAddSibling: () => void;
  onRename: () => void;
  onEditContent: () => void;
  onRegenerate: () => void;
  onLinkBidirectional: () => void;
  onAddOrReplaceImage: () => void;
  onRemoveImage: () => void;
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
  showImagePreviewAction: boolean;
  imagePreviewLabel: string;
  onImagePreviewClick: () => void;
  onSlideshowClick: () => void;
  regenerateLabel: string;
  regenerateLoadingLabel: string;
  regenerateProminent?: boolean;
  canRegenerate: boolean;
  isRegenerating: boolean;
  onRegenerateClick: () => void;
  onNoteClick: () => void;
  onHighlightClick: () => void;
  showAnnotationAction: boolean;
  showHighlightAction: boolean;
  moreActionsLabel: string;
  annotationAddLabel: string;
  highlightLabel: string;
  showSelectionContextMenuButton: boolean;
  onToggleMobileActionNode: () => void;
  onOpenSelectionContextMenu: (anchorEl: HTMLElement) => void;
  focusModeLabel: string;
  focusModeExitLabel: string;
  onExitFocus: () => void;
  noteEditorOpen: boolean;
  onNoteEditorOpenChange: (open: boolean) => void;
  noteDraft: string;
  onNoteDraftChange: (value: string) => void;
  onDeleteNote: () => void;
  onSaveNote: () => void;
  annotationDialogTitle: string;
  annotationPlaceholder: string;
  annotationDeleteLabel: string;
  cancelLabel: string;
  saveLabel: string;
  loading: boolean;
  ready: boolean;
};

function getNoteEditorStyle(selectedRect: DOMRect | null): CSSProperties {
  const gutter = 16;
  const desktopWidth = 360;
  const mobileWidth = `calc(100vw - ${gutter * 2}px)`;

  if (typeof window === "undefined") {
    return {
      right: gutter,
      top: gutter,
      width: `min(${desktopWidth}px, ${mobileWidth})`,
    };
  }

  if (window.innerWidth < 768 || !selectedRect) {
    return {
      left: gutter,
      right: gutter,
      bottom: gutter,
      width: "auto",
      maxHeight: "44vh",
    };
  }

  const panelWidth = Math.min(desktopWidth, window.innerWidth - gutter * 2);
  const estimatedHeight = 290;
  let left = selectedRect.left + selectedRect.width + 14;

  if (left + panelWidth > window.innerWidth - gutter) {
    left = selectedRect.left - panelWidth - 14;
  }

  left = Math.min(
    Math.max(gutter, left),
    Math.max(gutter, window.innerWidth - panelWidth - gutter)
  );

  let top = selectedRect.top + selectedRect.height / 2 - estimatedHeight / 2;
  top = Math.min(
    Math.max(gutter, top),
    Math.max(gutter, window.innerHeight - estimatedHeight - gutter)
  );

  return {
    left,
    top,
    width: panelWidth,
    maxHeight: `calc(100vh - ${gutter * 2}px)`,
  };
}

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
  disableRename,
  disableImageActions,
  disableEditContent,
  disableRegenerate,
  regenerating,
  onCloseMobileActions,
  onAddChild,
  onAddParent,
  onAddSibling,
  onRename,
  onEditContent,
  onRegenerate,
  onLinkBidirectional,
  onAddOrReplaceImage,
  onRemoveImage,
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
  showImagePreviewAction,
  imagePreviewLabel,
  onImagePreviewClick,
  onSlideshowClick,
  regenerateLabel,
  regenerateLoadingLabel,
  regenerateProminent = false,
  canRegenerate,
  isRegenerating,
  onRegenerateClick,
  onNoteClick,
  onHighlightClick,
  showAnnotationAction,
  showHighlightAction,
  moreActionsLabel,
  annotationAddLabel,
  highlightLabel,
  showSelectionContextMenuButton,
  onToggleMobileActionNode,
  onOpenSelectionContextMenu,
  focusModeLabel,
  focusModeExitLabel,
  onExitFocus,
  noteEditorOpen,
  onNoteEditorOpenChange,
  noteDraft,
  onNoteDraftChange,
  onDeleteNote,
  onSaveNote,
  annotationDialogTitle,
  annotationPlaceholder,
  annotationDeleteLabel,
  cancelLabel,
  saveLabel,
  loading,
  ready,
}: ClientMindElixirOverlayProps) {
  const noteEditorStyle = noteEditorOpen
    ? getNoteEditorStyle(selectedRect)
    : undefined;

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
        disableAddParent={selectedNodeIsRoot}
        disableAddSibling={selectedNodeIsRoot}
        disableRename={disableRename}
        disableEditContent={disableEditContent}
        disableRegenerate={disableRegenerate}
        disableImageActions={disableImageActions}
        disableRemove={selectedNodeIsRoot}
        regenerating={regenerating}
        onClose={onCloseMobileActions}
        onAddChild={onAddChild}
        onAddParent={onAddParent}
        onAddSibling={onAddSibling}
        onRename={onRename}
        onEditContent={onEditContent}
        onRegenerate={onRegenerate}
        onSlideshow={() => {
          onCloseMobileActions();
          onSlideshowClick();
        }}
        onLinkBidirectional={onLinkBidirectional}
        onAddOrReplaceImage={onAddOrReplaceImage}
        onRemoveImage={onRemoveImage}
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
            className="absolute z-[15]"
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
              {showImagePreviewAction && !regenerateProminent ? (
                <button
                  type="button"
                  className={`${hoverActionButtonClass} bg-sky-600 text-white ring-1 ring-sky-700/60`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onImagePreviewClick();
                  }}
                  aria-label={imagePreviewLabel}
                  title={imagePreviewLabel}
                >
                  <Icon icon="mdi:image-search-outline" className={hoverActionIconClass} />
                  <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {imagePreviewLabel}
                  </span>
                </button>
              ) : null}
              {canRegenerate ? (
                <button
                  type="button"
                  className={
                    regenerateProminent
                      ? "group relative inline-flex h-7 w-auto min-w-[64px] items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-2.5 text-[11px] font-extrabold text-white shadow-[0_14px_30px_-16px_rgba(5,150,105,0.8)] ring-1 ring-emerald-700/60 transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-80"
                      : `${hoverActionButtonClass} bg-indigo-600 text-white ring-1 ring-indigo-700/60 disabled:cursor-wait disabled:opacity-80`
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegenerateClick();
                  }}
                  disabled={isRegenerating}
                  aria-label={isRegenerating ? regenerateLoadingLabel : regenerateLabel}
                  title={isRegenerating ? regenerateLoadingLabel : regenerateLabel}
                >
                  <Icon
                    icon={
                      isRegenerating
                        ? "mdi:loading"
                        : regenerateProminent
                        ? "mdi:source-branch-plus"
                        : "mdi:auto-fix"
                    }
                    className={`${hoverActionIconClass} ${
                      isRegenerating ? "animate-spin" : ""
                    }`}
                  />
                  {regenerateProminent ? (
                    <span className="whitespace-nowrap">
                      {isRegenerating ? regenerateLoadingLabel : regenerateLabel}
                    </span>
                  ) : null}
                  <span
                    className={`pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 ${
                      regenerateProminent ? "hidden" : ""
                    }`}
                  >
                    {isRegenerating ? regenerateLoadingLabel : regenerateLabel}
                  </span>
                </button>
              ) : null}
              {showAnnotationAction && !regenerateProminent ? (
                <button
                  type="button"
                  className={`${hoverActionButtonClass} bg-red-500 text-white ring-1 ring-red-600/60`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNoteClick();
                  }}
                  aria-label={annotationAddLabel}
                >
                  <Icon icon="mdi:note-text-outline" className={hoverActionIconClass} />
                  <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {annotationAddLabel}
                  </span>
                </button>
              ) : null}
              {showHighlightAction && !regenerateProminent ? (
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
                  aria-label={highlightLabel}
                >
                  <Icon
                    icon="mdi:marker"
                    className={isTouchDevice ? "h-[10px] w-[10px]" : hoverActionIconClass}
                  />
                  <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {highlightLabel}
                  </span>
                </button>
              ) : null}
              {showMobileControls && editMode === "edit" && !regenerateProminent ? (
                <button
                  type="button"
                  className={`${hoverActionButtonClass} bg-slate-800 text-white ring-1 ring-slate-900/70`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNoteEditorOpenChange(false);
                    onToggleMobileActionNode();
                  }}
                  aria-label={moreActionsLabel}
                >
                  <Icon icon="mdi:dots-horizontal" className={hoverActionIconClass} />
                  <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {moreActionsLabel}
                  </span>
                </button>
              ) : showSelectionContextMenuButton && !isTouchDevice && !regenerateProminent ? (
                <button
                  type="button"
                  className={`${hoverActionButtonClass} bg-slate-800 text-white ring-1 ring-slate-900/70`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNoteEditorOpenChange(false);
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

      {noteEditorOpen ? (
        <div className="pointer-events-none absolute inset-0 z-[380]">
          <div
            className="pointer-events-auto absolute overflow-hidden rounded-2xl border border-slate-300/90 bg-white/98 p-4 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-white/12 dark:bg-[#0b1220]/98 dark:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)]"
            style={noteEditorStyle}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-200">
                    {annotationDialogTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                  onClick={() => onNoteEditorOpenChange(false)}
                  aria-label={cancelLabel}
                >
                  <Icon icon="mdi:close" className="h-4 w-4" />
                </button>
              </div>

              <textarea
                className="min-h-[132px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60 dark:border-white/10 dark:bg-[#0f172a] dark:text-white/85 dark:focus:border-blue-300 dark:focus:ring-blue-500/30"
                placeholder={annotationPlaceholder}
                value={noteDraft}
                onChange={(e) =>
                  onNoteDraftChange(
                    e.target.value.slice(0, NODE_NOTE_MAX_LENGTH)
                  )
                }
                maxLength={NODE_NOTE_MAX_LENGTH}
                autoFocus
              />

              <div className="flex items-center justify-between gap-3 text-[11px] text-neutral-500 dark:text-white/60">
                <span>
                  {noteDraft.length}/{NODE_NOTE_MAX_LENGTH}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
                    onClick={onDeleteNote}
                  >
                    {annotationDeleteLabel}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/10"
                    onClick={() => onNoteEditorOpenChange(false)}
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                    onClick={onSaveNote}
                  >
                    {saveLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
