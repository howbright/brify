"use client";

import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";

const SHORTCUT_ITEMS: Array<[string, string]> = [
  ["Enter", "형제 노드 삽입"],
  ["Shift + Enter", "앞쪽에 형제 노드 삽입"],
  ["Tab", "자식 노드 삽입"],
  ["Ctrl + Enter", "부모 노드 삽입"],
  ["F1", "맵 중앙 정렬"],
  ["F2", "현재 노드 편집"],
  ["↑", "이전 노드 선택"],
  ["↓", "다음 노드 선택"],
  ["← / →", "좌/우 노드 선택"],
  ["PageUp / Alt + ↑", "위로 이동"],
  ["PageDown / Alt + ↓", "아래로 이동"],
  ["Ctrl + ↑", "양쪽 레이아웃"],
  ["Ctrl + ←", "좌측 레이아웃"],
  ["Ctrl + →", "우측 레이아웃"],
  ["Ctrl + C", "복사"],
  ["Ctrl + X", "잘라내기"],
  ["Ctrl + V", "붙여넣기"],
  ["Delete / Backspace", "노드/화살표/요약 삭제"],
  ["Ctrl + +", "확대"],
  ["Ctrl + -", "축소"],
  ["Ctrl + 0", "확대/축소 초기화"],
  ["Ctrl + K, Ctrl + 0", "전체 접기"],
  ["Ctrl + K, Ctrl + =", "전체 펼치기"],
  ["Ctrl + K, Ctrl + 1-9", "N단계까지 펼치기"],
];

export default function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[260]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="닫기"
      />

      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto px-3 pb-4 pt-20 sm:items-center sm:px-5 sm:py-5">
        <div className="relative z-[1] flex w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-slate-400 bg-white p-4 shadow-[0_28px_90px_-40px_rgba(15,23,42,0.85)] dark:border-white/20 dark:bg-[#0F172A] dark:ring-1 dark:ring-white/16 dark:shadow-[0_34px_120px_-60px_rgba(0,0,0,0.95)] sm:max-h-[min(80vh,calc(100dvh-40px))] sm:w-[92vw] sm:p-5">
          <div
            className="
              pointer-events-none absolute inset-0 rounded-3xl
              bg-[radial-gradient(800px_260px_at_20%_0%,rgba(59,130,246,0.18),transparent_55%)]
              dark:bg-[radial-gradient(800px_260px_at_20%_0%,rgba(56,189,248,0.18),transparent_55%)]
            "
          />
          <div className="pointer-events-none absolute inset-0 rounded-3xl dark:bg-white/[0.03]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-400 dark:bg-white/20" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-blue-700 dark:text-[rgb(var(--hero-b))] md:text-2xl">
                단축키 안내
              </h3>
              <p className="mt-3 text-[15px] font-semibold text-neutral-900 dark:text-white sm:text-[17px]">
                Mind Elixir 기본 단축키 목록입니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="inline-flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-white/60 dark:hover:text-white"
            >
              <Icon icon="mdi:close" className="h-6 w-6" />
            </button>
          </div>

          <div className="relative mt-4 grid max-h-[calc(100dvh-180px)] gap-2 overflow-y-auto pr-1 text-[13px] text-neutral-700 dark:text-white/80 sm:max-h-[min(62vh,calc(100dvh-220px))] sm:text-[14px]">
            <div className="grid grid-cols-[1fr_1.4fr] gap-2 rounded-2xl border border-slate-400 bg-white px-3 py-2 text-[12px] font-semibold text-neutral-500 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/60 sm:text-[13px]">
              <span>단축키</span>
              <span>기능</span>
            </div>

            {SHORTCUT_ITEMS.map(([key, desc]) => (
              <div
                key={key}
                className="grid grid-cols-[1fr_1.4fr] gap-2 rounded-2xl border border-slate-400 bg-white px-3 py-2 dark:border-white/20 dark:bg-white/[0.08]"
              >
                <span className="font-semibold text-neutral-800 dark:text-white/85">
                  {key}
                </span>
                <span className="text-neutral-600 dark:text-white/70">
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
