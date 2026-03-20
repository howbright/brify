"use client";

import { Icon } from "@iconify/react";

export default function ConfirmShareDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-400 bg-white p-5 shadow-2xl dark:border-white/20 dark:bg-[#0b1220]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white/90">
              발행 후 공유
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-white/60">
              현재 변경사항을 발행하고 공유 링크를 생성할까요?
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-400 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/85 dark:hover:bg-white/[0.12]"
          >
            <Icon icon="mdi:close" className="h-4 w-4" />
            닫기
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-400 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/85 dark:hover:bg-white/[0.12]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-300/40 dark:bg-blue-500/10 dark:text-blue-50/90 dark:hover:bg-blue-500/20"
          >
            발행 후 공유
          </button>
        </div>
      </div>
    </div>
  );
}
