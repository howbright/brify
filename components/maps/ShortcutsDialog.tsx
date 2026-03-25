"use client";

import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { useLocale, useMessages } from "next-intl";

type ShortcutItem = { key: string; description: string };
type ShortcutMessages = {
  title?: string;
  description?: string;
  close?: string;
  columns?: {
    shortcut?: string;
    action?: string;
  };
  items?: ShortcutItem[];
};

export default function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const locale = useLocale();
  const messages = useMessages() as { ShortcutsDialog?: ShortcutMessages };
  const fallback: Required<Omit<ShortcutMessages, "items">> & { items: ShortcutItem[] } =
    locale === "ko"
      ? {
          title: "단축키 안내",
          description: "Mind Elixir 기본 단축키 목록입니다.",
          close: "닫기",
          columns: {
            shortcut: "단축키",
            action: "기능",
          },
          items: [
            { key: "Enter", description: "형제 노드 삽입" },
            { key: "Shift + Enter", description: "앞쪽에 형제 노드 삽입" },
            { key: "Tab", description: "자식 노드 삽입" },
            { key: "Ctrl + Enter", description: "부모 노드 삽입" },
            { key: "F1", description: "맵 중앙 정렬" },
            { key: "F2", description: "현재 노드 편집" },
            { key: "↑", description: "이전 노드 선택" },
            { key: "↓", description: "다음 노드 선택" },
            { key: "← / →", description: "좌/우 노드 선택" },
            { key: "PageUp / Alt + ↑", description: "위로 이동" },
            { key: "PageDown / Alt + ↓", description: "아래로 이동" },
            { key: "Ctrl + ↑", description: "양쪽 레이아웃" },
            { key: "Ctrl + ←", description: "좌측 레이아웃" },
            { key: "Ctrl + →", description: "우측 레이아웃" },
            { key: "Ctrl + C", description: "복사" },
            { key: "Ctrl + X", description: "잘라내기" },
            { key: "Ctrl + V", description: "붙여넣기" },
            { key: "Delete / Backspace", description: "노드/화살표/요약 삭제" },
            { key: "Ctrl + +", description: "확대" },
            { key: "Ctrl + -", description: "축소" },
            { key: "Ctrl + 0", description: "확대/축소 초기화" },
            { key: "Ctrl + K, Ctrl + 0", description: "전체 접기" },
            { key: "Ctrl + K, Ctrl + =", description: "전체 펼치기" },
            { key: "Ctrl + K, Ctrl + 1-9", description: "N단계까지 펼치기" },
          ],
        }
      : {
          title: "Keyboard Shortcuts",
          description: "Default Mind Elixir keyboard shortcuts.",
          close: "Close",
          columns: {
            shortcut: "Shortcut",
            action: "Action",
          },
          items: [
            { key: "Enter", description: "Insert sibling node" },
            { key: "Shift + Enter", description: "Insert sibling node before" },
            { key: "Tab", description: "Insert child node" },
            { key: "Ctrl + Enter", description: "Insert parent node" },
            { key: "F1", description: "Center the map" },
            { key: "F2", description: "Edit current node" },
            { key: "↑", description: "Select previous node" },
            { key: "↓", description: "Select next node" },
            { key: "← / →", description: "Select left/right node" },
            { key: "PageUp / Alt + ↑", description: "Move up" },
            { key: "PageDown / Alt + ↓", description: "Move down" },
            { key: "Ctrl + ↑", description: "Both-side layout" },
            { key: "Ctrl + ←", description: "Left layout" },
            { key: "Ctrl + →", description: "Right layout" },
            { key: "Ctrl + C", description: "Copy" },
            { key: "Ctrl + X", description: "Cut" },
            { key: "Ctrl + V", description: "Paste" },
            { key: "Delete / Backspace", description: "Delete node/edge/summary" },
            { key: "Ctrl + +", description: "Zoom in" },
            { key: "Ctrl + -", description: "Zoom out" },
            { key: "Ctrl + 0", description: "Reset zoom" },
            { key: "Ctrl + K, Ctrl + 0", description: "Collapse all" },
            { key: "Ctrl + K, Ctrl + =", description: "Expand all" },
            { key: "Ctrl + K, Ctrl + 1-9", description: "Expand to level N" },
          ],
        };
  const copy = {
    title: messages.ShortcutsDialog?.title ?? fallback.title,
    description: messages.ShortcutsDialog?.description ?? fallback.description,
    close: messages.ShortcutsDialog?.close ?? fallback.close,
    columns: {
      shortcut:
        messages.ShortcutsDialog?.columns?.shortcut ?? fallback.columns.shortcut,
      action:
        messages.ShortcutsDialog?.columns?.action ?? fallback.columns.action,
    },
    items: messages.ShortcutsDialog?.items ?? fallback.items,
  };
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[260]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label={copy.close}
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
                {copy.title}
              </h3>
              <p className="mt-3 text-[15px] font-semibold text-neutral-900 dark:text-white sm:text-[17px]">
                {copy.description}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.close}
              className="inline-flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-white/60 dark:hover:text-white"
            >
              <Icon icon="mdi:close" className="h-6 w-6" />
            </button>
          </div>

          <div className="relative mt-4 grid max-h-[calc(100dvh-180px)] gap-2 overflow-y-auto pr-1 text-[13px] text-neutral-700 dark:text-white/80 sm:max-h-[min(62vh,calc(100dvh-220px))] sm:text-[14px]">
            <div className="grid grid-cols-[1fr_1.4fr] gap-2 rounded-2xl border border-slate-400 bg-white px-3 py-2 text-[12px] font-semibold text-neutral-500 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/60 sm:text-[13px]">
              <span>{copy.columns.shortcut}</span>
              <span>{copy.columns.action}</span>
            </div>

            {copy.items.map(({ key, description }) => (
              <div
                key={key}
                className="grid grid-cols-[1fr_1.4fr] gap-2 rounded-2xl border border-slate-400 bg-white px-3 py-2 dark:border-white/20 dark:bg-white/[0.08]"
              >
                <span className="font-semibold text-neutral-800 dark:text-white/85">
                  {key}
                </span>
                <span className="text-neutral-600 dark:text-white/70">
                  {description}
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
