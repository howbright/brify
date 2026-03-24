"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import ShortcutsDialog from "@/components/maps/ShortcutsDialog";
import ConfirmShareDialog from "@/components/maps/ConfirmShareDialog";

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
  onCenterMap,
  onZoomIn,
  onZoomOut,
  highlightEditToggle = false,
  modeToggleTutorialId,
  editButtonTutorialId,
  editButtonId,
  placement = "floating",
  hidePanToggle = false,
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
  onCenterMap?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  highlightEditToggle?: boolean;
  modeToggleTutorialId?: string;
  editButtonTutorialId?: string;
  editButtonId?: string;
  placement?: "floating" | "inline";
  hidePanToggle?: boolean;
}) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [confirmShareOpen, setConfirmShareOpen] = useState(false);
  const [mapActionsOpen, setMapActionsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const mapActionsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapActionsOpen && !moreOpen && !themeOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mapActionsOpen, moreOpen, themeOpen]);

  return (
    <>
      <div
        className={
          placement === "inline"
            ? "flex items-center gap-2"
            : "absolute right-4 top-3 z-[16] flex items-center gap-2 max-[738px]:top-2"
        }
      >
        <div className="flex flex-col gap-2">
            <div
              className="
                flex items-center gap-2
                text-base font-extrabold text-neutral-700
                dark:text-white/80
              "
            >
            {/* Left: Mode + Status */}
            <div className="flex items-center gap-2">
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
                  aria-label="보기 모드"
                  title="보기 모드"
                >
                  <Icon icon="mdi:eye-outline" className="h-4 w-4" />
                  <span className="hidden min-[760px]:inline">보기</span>
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
                  aria-label="편집 모드"
                  title="편집 모드"
                >
                  <Icon icon="mdi:pencil" className="h-4 w-4" />
                  <span className="hidden min-[760px]:inline">편집</span>
                </button>
              </div>

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
                    aria-label="선택 모드"
                    title="선택 모드"
                  >
                    <Icon icon="mdi:arrow-top-left" className="h-4 w-4" />
                    <span className="hidden min-[760px]:inline">선택</span>
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
                    aria-label="이동 모드"
                    title="이동 모드"
                  >
                    <Icon icon="mdi:hand-back-left" className="h-4 w-4" />
                    <span className="hidden min-[760px]:inline">이동</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Map actions + More */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1">
                {onCenterMap && (
                  <MapControlButton
                    icon="mdi:crosshairs-gps"
                    label="가운데로"
                    onClick={onCenterMap}
                    hideLabel
                  />
                )}
                {onZoomOut && (
                  <MapControlButton
                    icon="mdi:minus"
                    label="축소"
                    onClick={onZoomOut}
                    hideLabel
                  />
                )}
                {onZoomIn && (
                  <MapControlButton
                    icon="mdi:plus"
                    label="확대"
                    onClick={onZoomIn}
                    hideLabel
                  />
                )}
                {(onCenterMap || onZoomIn || onZoomOut) && (
                  <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                )}
                <MapControlButton
                  icon="mdi:collapse-all-outline"
                  label="전체 접기"
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
                    aria-label="맵 조작"
                    aria-expanded={mapActionsOpen}
                    aria-haspopup="menu"
                    title="맵 조작"
                  >
                    <span className="hidden min-[760px]:inline leading-none">맵 조작</span>
                    <Icon
                      icon="mdi:chevron-down"
                      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                        mapActionsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {mapActionsOpen && (
                    <div className="absolute right-0 mt-2 w-[220px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]">
                      <MenuButton
                        icon="mdi:unfold-more-horizontal"
                        label="전체 펴기"
                        onClick={() => {
                          setMapActionsOpen(false);
                          onExpandAll();
                        }}
                      />
                      <MenuButton
                        icon="mdi:arrow-expand-vertical"
                        label="한단계 펴기"
                        onClick={() => {
                          setMapActionsOpen(false);
                          onExpandLevel();
                        }}
                      />
                      <MenuButton
                        icon="mdi:arrow-collapse-vertical"
                        label="한단계 접기"
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
                          label="왼쪽 정렬"
                          onClick={() => {
                            setMapActionsOpen(false);
                            onAlignLeft();
                          }}
                        />
                      )}
                      {onAlignRight && (
                        <MenuButton
                          icon="mdi:format-horizontal-align-right"
                          label="오른쪽 정렬"
                          onClick={() => {
                            setMapActionsOpen(false);
                            onAlignRight();
                          }}
                        />
                      )}
                      {onAlignSide && (
                        <MenuButton
                          icon="mdi:format-horizontal-align-center"
                          label="가운데 정렬"
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
                    label="테마"
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
                    label="더보기"
                    onClick={() => setMoreOpen((v) => !v)}
                  />

                  {moreOpen && (
                    <div className="absolute right-0 mt-2 w-[180px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]">
                      {onExportPng && (
                        <MenuButton
                          icon="mdi:image-outline"
                          label="이미지로 저장 (PNG)"
                          onClick={() => {
                            setMoreOpen(false);
                            onExportPng?.();
                          }}
                        />
                      )}
                      <MenuButton
                        icon="mdi:share-variant-outline"
                        label="공유"
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
                        label="단축키"
                        onClick={() => {
                          setMoreOpen(false);
                          setShortcutsOpen(true);
                        }}
                      />
                      {onCloseMap && (
                        <>
                          <div className="my-1 h-px bg-neutral-200 dark:bg-white/10" />
                          <MenuButton
                            icon="mdi:close-circle-outline"
                            label="맵 닫기"
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
  onClick,
  pressed = false,
  highlight = false,
  hideLabel = false,
}: {
  icon: string;
  label: string;
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
  onClick,
  danger = false,
  checked = false,
}: {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
  checked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-base font-semibold
        ${
          danger
            ? "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
            : "text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
        }
      `}
    >
      {icon ? <Icon icon={icon} className="h-5 w-5" /> : null}
      <span className="whitespace-nowrap">{label}</span>
      {checked ? (
        <Icon icon="mdi:check" className="ml-auto h-5 w-5" />
      ) : null}
    </button>
  );
}
