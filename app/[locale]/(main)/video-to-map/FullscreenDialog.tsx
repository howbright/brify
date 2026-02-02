"use client";

import { ReactNode } from "react";
import { Icon } from "@iconify/react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children?: ReactNode;
};

export default function FullscreenDialog({ open, title, onClose, children }: Props) {
  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-[120]
        bg-black/70 backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "다이얼로그"}
    >
      <div
        className="
          relative h-full w-full
          bg-white
          dark:bg-[#0b1220]
        "
      >
        <div className="absolute left-5 top-4 text-sm font-semibold text-neutral-800 dark:text-white/85">
          {title ?? "미리보기"}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="
            absolute right-4 top-4
            inline-flex items-center gap-1.5
            rounded-2xl border border-neutral-200 bg-white px-3 py-1.5
            text-xs font-semibold text-neutral-700 hover:bg-neutral-50
            dark:border-white/12 dark:bg-white/[0.06]
            dark:text-white/85 dark:hover:bg-white/10
          "
        >
          <Icon icon="mdi:close" className="h-4 w-4" />
          닫기
        </button>
        <div className="h-full w-full p-6">{children}</div>
      </div>
    </div>
  );
}
