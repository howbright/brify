"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import ShortcutsDialog from "@/components/maps/ShortcutsDialog";
import ConfirmShareDialog from "@/components/maps/ConfirmShareDialog";
import DiscardDraftDialog from "@/components/maps/DiscardDraftDialog";

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
  onPublish,
  onShare,
  onDiscardDraft,
  statusLabel,
  statusTone = "neutral",
  hasDraft = false,
  highlightEditToggle = false,
  placement = "floating",
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
  onPublish?: () => void;
  onShare?: () => void;
  onDiscardDraft?: () => void;
  statusLabel?: string;
  statusTone?: "neutral" | "warning" | "success";
  hasDraft?: boolean;
  highlightEditToggle?: boolean;
  placement?: "floating" | "inline";
}) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [confirmShareOpen, setConfirmShareOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
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
                text-[11px] font-semibold text-neutral-700
                dark:text-white/80
              "
            >
            {/* Left: Mode + Status */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-md border border-neutral-200/70 px-1 py-0.5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    if (editMode !== "view") onToggleEdit();
                  }}
                  className={`
                    inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-semibold transition-colors
                    ${editMode === "view"
                      ? "text-blue-800 dark:text-blue-100 bg-blue-100/70 dark:bg-blue-500/20 rounded-md shadow-[inset_0_1px_2px_rgba(15,23,42,0.25),inset_0_0_0_1px_rgba(59,130,246,0.35)]"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"}
                    ${highlightEditToggle ? "text-amber-600 dark:text-amber-300 animate-pulse" : ""}
                  `}
                  aria-label="보기 모드"
                  title="보기 모드"
                >
                  <Icon icon="mdi:eye-outline" className="h-3.5 w-3.5" />
                  <span className="hidden min-[680px]:inline">보기</span>
                </button>
                <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                <button
                  type="button"
                  onClick={() => {
                    if (editMode !== "edit") onToggleEdit();
                  }}
                  className={`
                    inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-semibold transition-colors
                    ${editMode === "edit"
                      ? "text-blue-800 dark:text-blue-100 bg-blue-100/70 dark:bg-blue-500/20 rounded-md shadow-[inset_0_1px_2px_rgba(15,23,42,0.25),inset_0_0_0_1px_rgba(59,130,246,0.35)]"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"}
                    ${highlightEditToggle ? "text-amber-600 dark:text-amber-300 animate-pulse" : ""}
                  `}
                  aria-label="편집 모드"
                  title="편집 모드"
                >
                  <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                  <span className="hidden min-[680px]:inline">편집</span>
                </button>
              </div>

              <div className="inline-flex items-center gap-1 rounded-md border border-neutral-200/70 px-1 py-0.5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    if (panMode) onTogglePanMode();
                  }}
                  className={`
                    inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-semibold transition-colors
                    ${!panMode
                      ? "text-blue-800 dark:text-blue-100 bg-blue-100/70 dark:bg-blue-500/20 rounded-md shadow-[inset_0_1px_2px_rgba(15,23,42,0.25),inset_0_0_0_1px_rgba(59,130,246,0.35)]"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"}
                  `}
                  aria-label="선택 모드"
                  title="선택 모드"
                >
                  <Icon icon="mdi:arrow-top-left" className="h-3.5 w-3.5" />
                  <span className="hidden min-[680px]:inline">선택</span>
                </button>
                <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                <button
                  type="button"
                  onClick={() => {
                    if (!panMode) onTogglePanMode();
                  }}
                  className={`
                    inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-semibold transition-colors
                    ${panMode
                      ? "text-blue-800 dark:text-blue-100 bg-blue-100/70 dark:bg-blue-500/20 rounded-md shadow-[inset_0_1px_2px_rgba(15,23,42,0.25),inset_0_0_0_1px_rgba(59,130,246,0.35)]"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"}
                  `}
                  aria-label="이동 모드"
                  title="이동 모드"
                >
                  <Icon icon="mdi:hand-back-left" className="h-3.5 w-3.5" />
                  <span className="hidden min-[680px]:inline">이동</span>
                </button>
              </div>
            </div>

            {/* Right: Map actions + More */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-md border border-neutral-200/70 px-1 py-0.5 dark:border-white/10">
                <MapControlButton
                  icon="mdi:collapse-all-outline"
                  label="전체 접기"
                  onClick={onCollapseAll}
                />
                <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                <div className="relative" ref={mapActionsRef}>
                  <MapControlButton
                    icon="mdi:vector-polyline"
                    label="맵 조작"
                    onClick={() => setMapActionsOpen((v) => !v)}
                  />

                  {mapActionsOpen && (
                    <div className="absolute right-0 mt-2 w-[180px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]">
                      <MenuButton
                        label="전체 펴기"
                        onClick={() => {
                          setMapActionsOpen(false);
                          onExpandAll();
                        }}
                      />
                      <MenuButton
                        label="한단계 펴기"
                        onClick={() => {
                          setMapActionsOpen(false);
                          onExpandLevel();
                        }}
                      />
                      <MenuButton
                        label="한단계 접기"
                        onClick={() => {
                          setMapActionsOpen(false);
                          onCollapseLevel();
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="inline-flex items-center gap-1 rounded-md border border-neutral-200/70 px-1 py-0.5 dark:border-white/10">
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
                      <MenuButton
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
                        label="단축키"
                        onClick={() => {
                          setMoreOpen(false);
                          setShortcutsOpen(true);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>

            {(statusLabel || hasDraft) && (
              <div className="flex items-center gap-2 px-1">
                <div className="flex-1" />
                {statusLabel && (
                  <span
                    className={`
                      text-[11px] font-semibold
                      ${
                        statusTone === "success"
                          ? "text-emerald-600 dark:text-emerald-300"
                          : statusTone === "warning"
                          ? "text-amber-600 dark:text-amber-300"
                          : "text-neutral-500 dark:text-white/70"
                      }
                    `}
                  >
                    {statusLabel}
                  </span>
                )}
                {hasDraft && (
                  <>
                    <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                    <button
                      type="button"
                      onClick={() => setConfirmDiscardOpen(true)}
                      className="
                        inline-flex items-center gap-1.5 px-1.5 py-0.5
                        text-[11px] font-semibold text-neutral-600
                        hover:text-neutral-900
                        dark:text-white/70 dark:hover:text-white
                      "
                    >
                      <Icon icon="mdi:undo-variant" className="h-3.5 w-3.5" />
                      임시 변경 버리기
                    </button>
                    <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                    <button
                      type="button"
                      onClick={() => onPublish?.()}
                      className="
                        inline-flex items-center gap-1.5 px-1.5 py-0.5
                        text-[11px] font-semibold text-blue-600
                        hover:text-blue-700
                        dark:text-blue-300 dark:hover:text-blue-200
                      "
                    >
                      <Icon icon="mdi:check-circle-outline" className="h-3.5 w-3.5" />
                      완료/발행
                    </button>
                  </>
                )}
              </div>
            )}
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

      <DiscardDraftDialog
        open={confirmDiscardOpen}
        onClose={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          onDiscardDraft?.();
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
}: {
  icon: string;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5
        px-1.5 py-0.5 text-[11px] font-semibold
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
      <Icon icon={icon} className="h-3.5 w-3.5" />
      <span className="hidden min-[680px]:inline">{label}</span>
    </button>
  );
}

function MenuButton({
  label,
  onClick,
  danger = false,
  checked = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  checked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full rounded-xl px-3 py-2 text-left text-xs font-semibold inline-flex items-center justify-between
        ${
          danger
            ? "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
            : "text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
        }
      `}
    >
      <span>{label}</span>
      {checked ? (
        <Icon icon="mdi:check" className="h-3.5 w-3.5" />
      ) : null}
    </button>
  );
}
