"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import ShortcutsDialog from "@/components/maps/ShortcutsDialog";
import ConfirmShareDialog from "@/components/maps/ConfirmShareDialog";
import DiscardDraftDialog from "@/components/maps/DiscardDraftDialog";

export default function MapControls({
  editMode,
  onToggleEdit,
  onCollapseAll,
  onExpandAll,
  onExpandLevel,
  onCollapseLevel,
  onPublish,
  onShare,
  onDiscardDraft,
  statusLabel,
  statusTone = "neutral",
}: {
  editMode: "view" | "edit";
  onToggleEdit: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onExpandLevel: () => void;
  onCollapseLevel: () => void;
  onPublish?: () => void;
  onShare?: () => void;
  onDiscardDraft?: () => void;
  statusLabel?: string;
  statusTone?: "neutral" | "warning" | "success";
}) {
  const [open, setOpen] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [confirmShareOpen, setConfirmShareOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [mapActionsOpen, setMapActionsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <div className="absolute right-4 top-3 z-[16] flex items-center gap-2 max-[738px]:top-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="
            inline-flex items-center justify-center
            rounded-full border border-neutral-200 bg-white/90 px-2.5 py-1.5
            text-[11px] font-semibold text-neutral-600 shadow-sm backdrop-blur
            hover:bg-white
            dark:border-white/10 dark:bg-[#0b1220]/70 dark:text-white/70 dark:hover:bg-[#0b1220]/90
          "
          aria-label={open ? "맵 도구 접기" : "맵 도구 펼치기"}
          title={open ? "맵 도구 접기" : "맵 도구 펼치기"}
        >
          <Icon
            icon={open ? "mdi:chevron-up" : "mdi:chevron-down"}
            className="h-4 w-4"
          />
        </button>

        {open && (
          <div
            className="
              flex items-center gap-2
              rounded-2xl border border-neutral-200 bg-white/90 px-2 py-1.5
              text-[11px] font-semibold text-neutral-700 shadow-sm backdrop-blur
              dark:border-white/10 dark:bg-[#0b1220]/70 dark:text-white/80
            "
          >
            {/* Left: Mode + Status */}
            <div className="flex items-center gap-2">
              <MapControlButton
                icon={editMode === "edit" ? "mdi:pencil" : "mdi:eye-outline"}
                label={editMode === "edit" ? "편집 모드" : "보기 모드"}
                onClick={onToggleEdit}
                pressed={editMode === "edit"}
              />

              {statusLabel && (
                <span
                  className={`
                    inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold
                    ${
                      statusTone === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200"
                        : statusTone === "warning"
                        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200"
                        : "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
                    }
                  `}
                >
                  {statusLabel}
                </span>
              )}
            </div>

            {/* Center: Publish + Share */}
            <div className="flex items-center gap-2">
              {editMode === "edit" && (
                <MapControlButton
                  icon="mdi:check-circle-outline"
                  label="완료/발행"
                  onClick={() => onPublish?.()}
                />
              )}

              <MapControlButton
                icon="mdi:share-variant-outline"
                label="공유"
                onClick={() => {
                  if (editMode === "edit") {
                    setConfirmShareOpen(true);
                  } else {
                    onShare?.();
                  }
                }}
              />
            </div>

            {/* Right: Map actions + More */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <MapControlButton
                  icon="mdi:vector-polyline"
                  label="맵 조작"
                  onClick={() => setMapActionsOpen((v) => !v)}
                />

                {mapActionsOpen && (
                  <div className="absolute right-0 mt-2 w-[180px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]">
                    <MenuButton
                      label="전체 접기"
                      onClick={() => {
                        setMapActionsOpen(false);
                        onCollapseAll();
                      }}
                    />
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

              <div className="relative">
                <MapControlButton
                  icon="mdi:dots-horizontal"
                  label="더보기"
                  onClick={() => setMoreOpen((v) => !v)}
                />

                {moreOpen && (
                  <div className="absolute right-0 mt-2 w-[180px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]">
                    <MenuButton
                      label="단축키"
                      onClick={() => {
                        setMoreOpen(false);
                        setShortcutsOpen(true);
                      }}
                    />
                    {editMode === "edit" && (
                      <MenuButton
                        label="임시 변경 버리기"
                        danger
                        onClick={() => {
                          setMoreOpen(false);
                          setConfirmDiscardOpen(true);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
}: {
  icon: string;
  label: string;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5
        rounded-xl border px-2.5 py-1
        text-[11px] font-semibold transition-colors duration-150
        ${
          pressed
            ? "border-blue-300 bg-blue-50 text-blue-700 shadow-[0_8px_18px_rgba(37,99,235,0.25)] dark:border-blue-300/60 dark:bg-blue-500/20 dark:text-blue-50"
            : "border-neutral-200 bg-white/80 text-neutral-700 hover:border-neutral-300 hover:bg-white hover:text-neutral-900 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/[0.12]"
        }
      `}
      aria-label={label}
      title={label}
    >
      <Icon icon={icon} className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function MenuButton({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full rounded-xl px-3 py-2 text-left text-xs font-semibold
        ${
          danger
            ? "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
            : "text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
        }
      `}
    >
      {label}
    </button>
  );
}
