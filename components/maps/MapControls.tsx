"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import ShortcutsDialog from "@/components/maps/ShortcutsDialog";
import ConfirmShareDialog from "@/components/maps/ConfirmShareDialog";
import { useLocale, useMessages } from "next-intl";

type ShortcutMap = Partial<
  Record<
    | "center"
    | "zoomIn"
    | "zoomOut"
    | "collapseAll"
    | "expandAll"
    | "expandLevel"
    | "collapseLevel"
    | "alignLeft"
    | "alignRight"
    | "alignCenter",
    string
  >
>;

type MapControlsMessages = {
  mode?: {
    view?: string;
    viewAria?: string;
    edit?: string;
    editAria?: string;
  };
  pan?: {
    select?: string;
    selectAria?: string;
    move?: string;
    moveAria?: string;
  };
  menus?: {
    mapActions?: string;
    theme?: string;
    more?: string;
  };
  actions?: {
    center?: string;
    zoomIn?: string;
    zoomOut?: string;
    collapseAll?: string;
    expandAll?: string;
    expandLevel?: string;
    collapseLevel?: string;
    alignLeft?: string;
    alignRight?: string;
    alignCenter?: string;
    exportPng?: string;
    share?: string;
    shortcuts?: string;
    tutorial?: string;
    closeMap?: string;
    timestampsShow?: string;
    timestampsHide?: string;
  };
};

export default function MapControls({
  editMode,
  panMode,
  themes,
  currentThemeName,
  onToggleEdit,
  onTogglePanMode,
  onSelectTheme,
  onCollapseAll,
  onExpandAll,
  onExpandLevel,
  onCollapseLevel,
  onAlignLeft,
  onAlignRight,
  onAlignSide,
  onPublish,
  onShare,
  onExportPng,
  onCloseMap,
  onOpenTutorial,
  onCenterMap,
  onZoomIn,
  onZoomOut,
  showTimestamps,
  onToggleTimestamps,
  highlightEditToggle = false,
  modeToggleTutorialId,
  editButtonTutorialId,
  editButtonId,
  placement = "floating",
  hidePanToggle = false,
  hideEditToggle = false,
}: {
  editMode: "view" | "edit";
  panMode: boolean;
  themes: Array<{ name: string }>;
  currentThemeName?: string;
  onToggleEdit: () => void;
  onTogglePanMode: () => void;
  onSelectTheme: (name: string) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onExpandLevel: () => void;
  onCollapseLevel: () => void;
  onAlignLeft?: () => void;
  onAlignRight?: () => void;
  onAlignSide?: () => void;
  onPublish?: () => void;
  onShare?: () => void;
  onExportPng?: () => void;
  onCloseMap?: () => void;
  onOpenTutorial?: () => void;
  onCenterMap?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  showTimestamps?: boolean;
  onToggleTimestamps?: () => void;
  highlightEditToggle?: boolean;
  modeToggleTutorialId?: string;
  editButtonTutorialId?: string;
  editButtonId?: string;
  placement?: "floating" | "inline";
  hidePanToggle?: boolean;
  hideEditToggle?: boolean;
}) {
  const locale = useLocale();
  const messages = useMessages() as { MapControls?: MapControlsMessages };
  const fallback =
    locale === "ko"
      ? {
          mode: {
            view: "보기",
            viewAria: "보기 모드",
            edit: "편집",
            editAria: "편집 모드",
          },
          pan: {
            select: "선택",
            selectAria: "선택 모드",
            move: "이동",
            moveAria: "이동 모드",
          },
          menus: {
            mapActions: "맵 조작",
            theme: "테마",
            more: "더보기",
          },
          actions: {
            center: "가운데로",
            zoomIn: "확대",
            zoomOut: "축소",
            collapseAll: "전체 접기",
            expandAll: "전체 펴기",
            expandLevel: "한단계 펴기",
            collapseLevel: "한단계 접기",
            alignLeft: "왼쪽 정렬",
            alignRight: "오른쪽 정렬",
            alignCenter: "가운데 정렬",
            exportPng: "이미지로 저장 (PNG)",
            share: "공유",
            shortcuts: "단축키",
            tutorial: "튜토리얼",
            closeMap: "맵 닫기",
            timestampsShow: "타임스탬프 보기",
            timestampsHide: "타임스탬프 숨기기",
          },
        }
      : {
          mode: {
            view: "View",
            viewAria: "View mode",
            edit: "Edit",
            editAria: "Edit mode",
          },
          pan: {
            select: "Select",
            selectAria: "Select mode",
            move: "Pan",
            moveAria: "Pan mode",
          },
          menus: {
            mapActions: "Map actions",
            theme: "Theme",
            more: "More",
          },
          actions: {
            center: "Center",
            zoomIn: "Zoom in",
            zoomOut: "Zoom out",
            collapseAll: "Collapse all",
            expandAll: "Expand all",
            expandLevel: "Expand one level",
            collapseLevel: "Collapse one level",
            alignLeft: "Align left",
            alignRight: "Align right",
            alignCenter: "Center align",
            exportPng: "Save as image (PNG)",
            share: "Share",
            shortcuts: "Shortcuts",
            tutorial: "Tutorial",
            closeMap: "Close map",
            timestampsShow: "Show timestamps",
            timestampsHide: "Hide timestamps",
          },
        };
  const copy = {
    mode: { ...fallback.mode, ...messages.MapControls?.mode },
    pan: { ...fallback.pan, ...messages.MapControls?.pan },
    menus: { ...fallback.menus, ...messages.MapControls?.menus },
    actions: { ...fallback.actions, ...messages.MapControls?.actions },
  };
  const shortcuts: ShortcutMap =
    locale === "ko"
      ? {
          center: "F1",
          zoomIn: "Ctrl + +",
          zoomOut: "Ctrl + -",
          collapseAll: "Ctrl + K, Ctrl + 0",
          expandAll: "Ctrl + K, Ctrl + =",
          expandLevel: "Ctrl + K",
          alignLeft: "Ctrl + ←",
          alignRight: "Ctrl + →",
          alignCenter: "Ctrl + ↑",
        }
      : {
          center: "F1",
          zoomIn: "Ctrl + +",
          zoomOut: "Ctrl + -",
          collapseAll: "Ctrl + K, Ctrl + 0",
          expandAll: "Ctrl + K, Ctrl + =",
          expandLevel: "Ctrl + K",
          alignLeft: "Ctrl + ←",
          alignRight: "Ctrl + →",
          alignCenter: "Ctrl + ↑",
        };
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [confirmShareOpen, setConfirmShareOpen] = useState(false);
  const [mapActionsOpen, setMapActionsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [shortcutHintOpen, setShortcutHintOpen] = useState(false);
  const mapActionsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const shortcutHintRef = useRef<HTMLDivElement>(null);
  const shortcutHintItems =
    locale === "ko"
      ? [
          { label: "가운데로", value: shortcuts.center },
          { label: "확대", value: shortcuts.zoomIn },
          { label: "축소", value: shortcuts.zoomOut },
        ]
      : [
          { label: "Center", value: shortcuts.center },
          { label: "Zoom in", value: shortcuts.zoomIn },
          { label: "Zoom out", value: shortcuts.zoomOut },
        ];
  const shortcutHintLabel = locale === "ko" ? "힌트" : "Hint";

  useEffect(() => {
    if (!mapActionsOpen && !moreOpen && !themeOpen && !shortcutHintOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (shortcutHintOpen && shortcutHintRef.current?.contains(target)) {
        return;
      }

      if (mapActionsOpen && mapActionsRef.current?.contains(target)) {
        return;
      }
      if (moreOpen && moreRef.current?.contains(target)) {
        return;
      }
      if (themeOpen && themeRef.current?.contains(target)) {
        return;
      }

      setMapActionsOpen(false);
      setMoreOpen(false);
      setThemeOpen(false);
      setShortcutHintOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mapActionsOpen, moreOpen, themeOpen, shortcutHintOpen]);

  return (
    <>
      <div
        className={
          placement === "inline"
            ? "flex items-center gap-2"
            : "absolute right-4 top-3 z-[16] flex items-center gap-2 max-[738px]:top-2"
        }
      >
        <div className="relative flex items-center gap-2">
          <div
            className="
              flex items-center gap-2
              text-base font-extrabold text-neutral-700
              dark:text-white/80
            "
          >
            {/* Left: Mode + Status */}
            <div className="flex items-center gap-2">
              {!hideEditToggle && (
                <div
                  className="inline-flex items-center gap-1"
                  data-tutorial-id={modeToggleTutorialId}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (editMode !== "view") onToggleEdit();
                    }}
                    className={`
                      inline-flex items-center gap-1.5 px-2 py-1 text-base font-extrabold transition-colors
                      ${editMode === "view"
                        ? "text-blue-800 dark:text-blue-100 bg-blue-100/70 dark:bg-blue-500/20 rounded-md shadow-[inset_0_1px_2px_rgba(15,23,42,0.25),inset_0_0_0_1px_rgba(59,130,246,0.35)]"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"}
                      ${highlightEditToggle ? "text-amber-600 dark:text-amber-300 animate-pulse" : ""}
                    `}
                    aria-label={copy.mode.viewAria}
                    title={copy.mode.viewAria}
                  >
                    <Icon icon="mdi:eye-outline" className="h-4 w-4" />
                    <span className="hidden min-[760px]:inline">{copy.mode.view}</span>
                  </button>
                  <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                  <button
                    type="button"
                    onClick={() => {
                      if (editMode !== "edit") onToggleEdit();
                    }}
                    id={editButtonId}
                    data-tutorial-id={editButtonTutorialId}
                    className={`
                      inline-flex items-center gap-1.5 px-2 py-1 text-base font-extrabold transition-colors
                      ${editMode === "edit"
                        ? "text-blue-800 dark:text-blue-100 bg-blue-100/70 dark:bg-blue-500/20 rounded-md shadow-[inset_0_1px_2px_rgba(15,23,42,0.25),inset_0_0_0_1px_rgba(59,130,246,0.35)]"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"}
                      ${highlightEditToggle ? "text-amber-600 dark:text-amber-300 animate-pulse" : ""}
                    `}
                    aria-label={copy.mode.editAria}
                    title={copy.mode.editAria}
                  >
                    <Icon icon="mdi:pencil" className="h-4 w-4" />
                    <span className="hidden min-[760px]:inline">{copy.mode.edit}</span>
                  </button>
                </div>
              )}

              {!hidePanToggle && (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (panMode) onTogglePanMode();
                    }}
                    className={`
                      inline-flex items-center gap-1.5 px-2 py-1 text-base font-extrabold transition-colors
                      ${!panMode
                        ? "text-blue-800 dark:text-blue-100 bg-blue-100/70 dark:bg-blue-500/20 rounded-md shadow-[inset_0_1px_2px_rgba(15,23,42,0.25),inset_0_0_0_1px_rgba(59,130,246,0.35)]"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"}
                    `}
                    aria-label={copy.pan.selectAria}
                    title={copy.pan.selectAria}
                  >
                    <Icon icon="mdi:arrow-top-left" className="h-4 w-4" />
                    <span className="hidden min-[760px]:inline">{copy.pan.select}</span>
                  </button>
                  <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                  <button
                    type="button"
                    onClick={() => {
                      if (!panMode) onTogglePanMode();
                    }}
                    className={`
                      inline-flex items-center gap-1.5 px-2 py-1 text-base font-extrabold transition-colors
                      ${panMode
                        ? "text-blue-800 dark:text-blue-100 bg-blue-100/70 dark:bg-blue-500/20 rounded-md shadow-[inset_0_1px_2px_rgba(15,23,42,0.25),inset_0_0_0_1px_rgba(59,130,246,0.35)]"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"}
                    `}
                    aria-label={copy.pan.moveAria}
                    title={copy.pan.moveAria}
                  >
                    <Icon icon="mdi:hand-back-left" className="h-4 w-4" />
                    <span className="hidden min-[760px]:inline">{copy.pan.move}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Map actions + More */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1">
                <div
                  ref={shortcutHintRef}
                  className="relative hidden min-[760px]:inline-flex"
                >
                  <button
                    type="button"
                    onClick={() => setShortcutHintOpen((open) => !open)}
                    className="
                      inline-flex items-center rounded-full
                      border border-cyan-300 bg-[#22f0ff] px-2 py-0.5
                      text-[10px] font-extrabold text-[#062033] transition-colors
                      shadow-[0_0_0_1px_rgba(34,240,255,0.35),0_8px_22px_-12px_rgba(34,240,255,0.9)]
                      hover:bg-[#5af5ff]
                      dark:border-cyan-200 dark:bg-[#39ff9c]
                      dark:text-[#062312] dark:shadow-[0_0_0_1px_rgba(57,255,156,0.4),0_10px_24px_-12px_rgba(57,255,156,0.95)]
                      dark:hover:bg-[#63ffae]
                    "
                    aria-expanded={shortcutHintOpen}
                    aria-label={locale === "ko" ? "단축키 힌트 토글" : "Toggle shortcut hint"}
                  >
                    {shortcutHintLabel}
                  </button>
                  {shortcutHintOpen ? (
                    <div className="absolute left-1/2 top-full z-20 mt-2 flex w-max max-w-[280px] -translate-x-1/2 items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/95 px-3 py-2.5 text-[11px] font-medium text-amber-950 shadow-[0_14px_28px_-18px_rgba(245,158,11,0.65)] dark:border-amber-300/20 dark:bg-[#2a1905]/95 dark:text-amber-50">
                      <span className="pointer-events-none absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] border-l border-t border-amber-200 bg-amber-50/95 dark:border-amber-300/20 dark:bg-[#2a1905]/95" />
                      <Icon
                        icon="mdi:keyboard-outline"
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-200"
                      />
                      <div className="flex min-w-0 flex-col items-start gap-0.5">
                        {shortcutHintItems.map((item) => (
                          <span key={item.label} className="whitespace-nowrap leading-4">
                            {item.label} <strong>{item.value}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                {onCenterMap && (
                  <MapControlButton
                    icon="mdi:crosshairs-gps"
                    label={copy.actions.center}
                    shortcut={shortcuts.center}
                    onClick={onCenterMap}
                    hideLabel
                  />
                )}
                {onZoomOut && (
                  <MapControlButton
                    icon="mdi:minus"
                    label={copy.actions.zoomOut}
                    shortcut={shortcuts.zoomOut}
                    onClick={onZoomOut}
                    hideLabel
                  />
                )}
                {onZoomIn && (
                  <MapControlButton
                    icon="mdi:plus"
                    label={copy.actions.zoomIn}
                    shortcut={shortcuts.zoomIn}
                    onClick={onZoomIn}
                    hideLabel
                  />
                )}
                {onToggleTimestamps && (
                  <MapControlButton
                    icon="mdi:timeline-clock-outline"
                    label={
                      showTimestamps
                        ? copy.actions.timestampsHide
                        : copy.actions.timestampsShow
                    }
                    onClick={onToggleTimestamps}
                    pressed={Boolean(showTimestamps)}
                    hideLabel
                  />
                )}
                {(onCenterMap || onZoomIn || onZoomOut || onToggleTimestamps) && (
                  <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                )}
                <MapControlButton
                  icon="mdi:collapse-all-outline"
                  label={copy.actions.collapseAll}
                  shortcut={shortcuts.collapseAll}
                  onClick={onCollapseAll}
                />
                <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                <div className="relative" ref={mapActionsRef}>
                  <button
                    type="button"
                    onClick={() => setMapActionsOpen((v) => !v)}
                    className={`
                      inline-flex items-center gap-1 rounded-lg px-2 py-1 text-base font-extrabold transition-colors duration-150
                      ${
                        mapActionsOpen
                          ? "bg-blue-100/80 text-blue-800 shadow-[inset_0_1px_2px_rgba(15,23,42,0.18),inset_0_0_0_1px_rgba(59,130,246,0.3)] dark:bg-blue-500/20 dark:text-blue-100"
                          : "text-neutral-700 hover:bg-slate-200/70 hover:text-neutral-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                      }
                    `}
                    aria-label={copy.menus.mapActions}
                    aria-expanded={mapActionsOpen}
                    aria-haspopup="menu"
                    title={copy.menus.mapActions}
                  >
                    <span className="hidden min-[760px]:inline leading-none">{copy.menus.mapActions}</span>
                    <Icon
                      icon="mdi:chevron-down"
                      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                        mapActionsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {mapActionsOpen && (
                    <div className="absolute right-0 mt-2 w-[268px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]">
                        <MenuButton
                          icon="mdi:unfold-more-horizontal"
                          label={copy.actions.expandAll}
                          shortcut={shortcuts.expandAll}
                          onClick={() => {
                          setMapActionsOpen(false);
                          onExpandAll();
                        }}
                      />
                        <MenuButton
                          icon="mdi:arrow-expand-vertical"
                          label={copy.actions.expandLevel}
                          shortcut={shortcuts.expandLevel}
                          onClick={() => {
                          setMapActionsOpen(false);
                          onExpandLevel();
                        }}
                      />
                        <MenuButton
                          icon="mdi:arrow-collapse-vertical"
                          label={copy.actions.collapseLevel}
                          onClick={() => {
                          setMapActionsOpen(false);
                          onCollapseLevel();
                        }}
                      />
                      {(onAlignLeft || onAlignRight || onAlignSide) && (
                        <div className="my-1 h-px bg-neutral-200 dark:bg-white/10" />
                      )}
                      {onAlignLeft && (
                        <MenuButton
                          icon="mdi:format-horizontal-align-left"
                          label={copy.actions.alignLeft}
                          shortcut={shortcuts.alignLeft}
                          onClick={() => {
                            setMapActionsOpen(false);
                            onAlignLeft();
                          }}
                        />
                      )}
                      {onAlignRight && (
                        <MenuButton
                          icon="mdi:format-horizontal-align-right"
                          label={copy.actions.alignRight}
                          shortcut={shortcuts.alignRight}
                          onClick={() => {
                            setMapActionsOpen(false);
                            onAlignRight();
                          }}
                        />
                      )}
                      {onAlignSide && (
                        <MenuButton
                          icon="mdi:format-horizontal-align-center"
                          label={copy.actions.alignCenter}
                          shortcut={shortcuts.alignCenter}
                          onClick={() => {
                            setMapActionsOpen(false);
                            onAlignSide();
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="inline-flex items-center gap-1">
                <div className="relative" ref={themeRef}>
                  <MapControlButton
                    icon="mdi:palette-outline"
                    label={copy.menus.theme}
                    onClick={() => setThemeOpen((v) => !v)}
                  />

                  {themeOpen && (
                    <div className="absolute right-0 mt-2 w-[200px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]">
                      {themes.map((theme) => (
                        <MenuButton
                          key={theme.name}
                          label={theme.name}
                          checked={theme.name === currentThemeName}
                          onClick={() => {
                            setThemeOpen(false);
                            onSelectTheme(theme.name);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                <div className="relative" ref={moreRef}>
                  <MapControlButton
                    icon="mdi:dots-horizontal"
                    label={copy.menus.more}
                    onClick={() => setMoreOpen((v) => !v)}
                  />

                  {moreOpen && (
                    <div className="absolute right-0 mt-2 w-[240px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]">
                      {onExportPng && (
                        <MenuButton
                          icon="mdi:image-outline"
                          label={copy.actions.exportPng}
                          onClick={() => {
                            setMoreOpen(false);
                            onExportPng?.();
                          }}
                        />
                      )}
                      <MenuButton
                        icon="mdi:share-variant-outline"
                        label={copy.actions.share}
                        onClick={() => {
                          setMoreOpen(false);
                          if (editMode === "edit") {
                            setConfirmShareOpen(true);
                          } else {
                            onShare?.();
                          }
                        }}
                      />
                      <MenuButton
                        icon="mdi:keyboard-outline"
                        label={copy.actions.shortcuts}
                        onClick={() => {
                          setMoreOpen(false);
                          setShortcutsOpen(true);
                        }}
                      />
                      {onOpenTutorial && (
                        <MenuButton
                          icon="mdi:school-outline"
                          label={copy.actions.tutorial}
                          onClick={() => {
                            setMoreOpen(false);
                            onOpenTutorial();
                          }}
                        />
                      )}
                      {onCloseMap && (
                        <>
                          <div className="my-1 h-px bg-neutral-200 dark:bg-white/10" />
                          <MenuButton
                            icon="mdi:close-circle-outline"
                            label={copy.actions.closeMap}
                            danger
                            onClick={() => {
                              setMoreOpen(false);
                              onCloseMap();
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <ConfirmShareDialog
        open={confirmShareOpen}
        onClose={() => setConfirmShareOpen(false)}
        onConfirm={() => {
          setConfirmShareOpen(false);
          onPublish?.();
          onShare?.();
        }}
      />

    </>
  );
}

function MapControlButton({
  icon,
  label,
  shortcut: _shortcut,
  onClick,
  pressed = false,
  highlight = false,
  hideLabel = false,
}: {
  icon: string;
  label: string;
  shortcut?: string;
  onClick: () => void;
  pressed?: boolean;
  highlight?: boolean;
  hideLabel?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5
        px-2 py-1 text-base font-extrabold
        transition-colors duration-150
        ${
          pressed
            ? "text-blue-800 dark:text-blue-100 bg-blue-100/70 dark:bg-blue-500/20 rounded-md shadow-[inset_0_1px_2px_rgba(15,23,42,0.25),inset_0_0_0_1px_rgba(59,130,246,0.35)]"
            : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"
        }
        ${highlight ? "text-amber-600 dark:text-amber-300 animate-pulse" : ""}
      `}
      aria-label={label}
      title={label}
    >
      <Icon
        icon={icon}
        className={
          icon === "mdi:plus" || icon === "mdi:minus"
            ? "h-6 w-6"
            : "h-4 w-4"
        }
      />
      {!hideLabel && (
      <span className="hidden min-[760px]:inline">{label}</span>
      )}
    </button>
  );
}

function MenuButton({
  label,
  icon,
  shortcut,
  onClick,
  danger = false,
  checked = false,
}: {
  label: string;
  icon?: string;
  shortcut?: string;
  onClick: () => void;
  danger?: boolean;
  checked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium
        ${
          danger
            ? "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
            : "text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
        }
      `}
    >
      {icon ? <Icon icon={icon} className="h-5 w-5" /> : null}
      <span className="whitespace-nowrap">{label}</span>
      {shortcut ? (
        <span className="ml-auto whitespace-nowrap rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:bg-white/10 dark:text-white/55">
          {shortcut}
        </span>
      ) : null}
      {checked ? (
        <Icon
          icon="mdi:check"
          className={`${shortcut ? "ml-2" : "ml-auto"} h-5 w-5`}
        />
      ) : null}
    </button>
  );
}
