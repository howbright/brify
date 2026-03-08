"use client";

import { Icon } from "@iconify/react";

export default function ShareDialog({
  open,
  onClose,
  loading,
  shareEnabled,
  shareUrl,
  onEnable,
  onDisable,
  onCopy,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  shareEnabled: boolean;
  shareUrl: string | null;
  onEnable: () => void;
  onDisable: () => void;
  onCopy: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[230]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0b1220]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white/90">
              공유 링크
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-white/60">
              링크를 가진 누구나 읽기 전용으로 볼 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
          >
            <Icon icon="mdi:close" className="h-4 w-4" />
            닫기
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {shareEnabled && shareUrl ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{shareUrl}</span>
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80 dark:hover:bg-white/10"
                >
                  <Icon icon="mdi:content-copy" className="h-3.5 w-3.5" />
                  복사
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-3 text-xs text-neutral-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60">
              공유 링크를 생성하면 여기서 복사할 수 있습니다.
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          {shareEnabled ? (
            <button
              type="button"
              onClick={onDisable}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100 dark:hover:bg-rose-500/20"
            >
              링크 끄기
            </button>
          ) : (
            <button
              type="button"
              onClick={onEnable}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60 dark:border-blue-300/40 dark:bg-blue-500/10 dark:text-blue-50/90 dark:hover:bg-blue-500/20"
            >
              링크 생성
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
