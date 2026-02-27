"use client";

import { Icon } from "@iconify/react";

export default function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0b1220] max-h-[80vh] flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white/90">
              단축키 안내
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-white/60">
              Mind Elixir 기본 단축키 목록입니다.
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

        <div className="mt-4 grid gap-2 text-xs text-neutral-700 dark:text-white/80 overflow-y-auto pr-1">
          <div className="grid grid-cols-[1fr_1.4fr] gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 font-semibold text-[11px] text-neutral-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
            <span>단축키</span>
            <span>기능</span>
          </div>

          {[
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
          ].map(([key, desc]) => (
            <div
              key={key}
              className="grid grid-cols-[1fr_1.4fr] gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]"
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
  );
}
