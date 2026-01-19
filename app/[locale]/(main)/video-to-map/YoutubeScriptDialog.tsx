"use client";

import { Icon } from "@iconify/react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;

  youtubeUrl: string;
  setYoutubeUrl: (v: string) => void;

  onFetch: () => void;
  isFetching: boolean;

  error: string | null;
  success: string | null;
};

export default function YoutubeScriptDialog({
  open,
  onClose,
  youtubeUrl,
  setYoutubeUrl,
  onFetch,
  isFetching,
  error,
  success,
}: Props) {
  // ✅ ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="유튜브 링크로 스크립트 가져오기"
      onMouseDown={(e) => {
        // ✅ 바깥 클릭 닫기
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="
          w-full max-w-lg rounded-3xl
          bg-white/98 border border-neutral-200
          shadow-[0_24px_70px_-30px_rgba(15,23,42,0.85)]
          p-5 md:p-6
          dark:bg-[#020617]/98 dark:border-white/12
        "
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Icon icon="mdi:youtube" className="h-5 w-5 text-red-500" />
              유튜브 링크로 스크립트 가져오기
            </h2>
            <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-300">
              성공하면 입력칸에 자동으로 채워 드립니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl p-2
              text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100
              dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/10
            "
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
            유튜브 URL
          </label>
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="
              w-full rounded-2xl border border-neutral-200 bg-white
              px-3 py-2 text-sm text-neutral-900
              placeholder:text-neutral-400
              focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
              dark:border-white/12 dark:bg-black/35 dark:text-neutral-50 dark:placeholder:text-neutral-500
            "
          />

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            >
              {success}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-2xl px-3.5 py-2 text-xs md:text-sm text-neutral-700
              border border-neutral-300 bg-white
              hover:bg-neutral-100
              dark:text-neutral-100 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10
            "
          >
            취소
          </button>

          <button
            type="button"
            onClick={onFetch}
            disabled={isFetching}
            className="
              inline-flex items-center gap-2 rounded-2xl px-3.5 py-2
              text-xs md:text-sm font-semibold text-white
              bg-neutral-900 hover:bg-neutral-800
              dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200
              transition-transform hover:scale-[1.02] active:scale-100
              disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed
            "
          >
            {isFetching ? (
              <>
                <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
                가져오는 중...
              </>
            ) : (
              <>
                <Icon icon="mdi:download-outline" className="h-4 w-4" />
                스크립트 가져오기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
