"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

export default function MapControls({
  editMode,
  onToggleEdit,
  onCollapseAll,
  onExpandAll,
  onExpandLevel,
  onCollapseLevel,
}: {
  editMode: "view" | "edit";
  onToggleEdit: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onExpandLevel: () => void;
  onCollapseLevel: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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
              flex items-center gap-1.5
              rounded-2xl border border-neutral-200 bg-white/90 px-2 py-1.5
              text-[11px] font-semibold text-neutral-700 shadow-sm backdrop-blur
              dark:border-white/10 dark:bg-[#0b1220]/70 dark:text-white/80
            "
          >
            <MapControlButton
              icon={editMode === "edit" ? "mdi:pencil" : "mdi:eye-outline"}
              label={editMode === "edit" ? "편집 모드" : "보기 모드"}
              onClick={onToggleEdit}
              pressed={editMode === "edit"}
            />

            <div className="mx-1 h-4 w-px bg-neutral-200/70 dark:bg-white/15" />

            <MapControlButton
              icon="mdi:arrow-collapse-up"
              label="전체 접기"
              onClick={onCollapseAll}
            />
            <MapControlButton
              icon="mdi:arrow-expand-down"
              label="전체 펴기"
              onClick={onExpandAll}
            />
            <MapControlButton
              icon="mdi:unfold-more-horizontal"
              label="한단계 펴기"
              onClick={onExpandLevel}
            />
            <MapControlButton
              icon="mdi:unfold-less-horizontal"
              label="한단계 접기"
              onClick={onCollapseLevel}
            />

            <div className="mx-1 h-4 w-px bg-neutral-200/70 dark:bg-white/15" />

            <MapControlButton
              icon="mdi:keyboard-outline"
              label="단축키"
              onClick={() => setShortcutsOpen(true)}
            />
          </div>
        )}
      </div>

      {shortcutsOpen && (
        <div className="fixed inset-0 z-[220]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setShortcutsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0b1220]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white/90">
                  단축키 안내
                </h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-white/60">
                  자주 쓰는 조작을 빠르게 실행할 수 있어요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShortcutsOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
              >
                <Icon icon="mdi:close" className="h-4 w-4" />
                닫기
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
              현재 단축키 목록은 준비 중입니다. 곧 업데이트될 예정이에요.
            </div>
          </div>
        </div>
      )}
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
