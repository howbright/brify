"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Icon } from "@iconify/react";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: ReactNode;
  actionLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "초기화할까요?",
  description = "진행 중이던 내용이 모두 사라집니다.",
  actionLabel = "초기화",
  cancelLabel = "취소",
  tone = "danger",
}: ConfirmDialogProps) {
  const actionClasses =
    tone === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-[0_10px_30px_-18px_rgba(225,29,72,0.8)] dark:bg-rose-500 dark:hover:bg-rose-400 dark:text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_10px_30px_-18px_rgba(37,99,235,0.8)] dark:bg-[rgb(var(--hero-b))] dark:hover:bg-[rgb(var(--hero-a))] dark:text-neutral-950";

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-sm" />
        <AlertDialog.Content
          className="
            fixed left-1/2 top-1/2 z-[210] w-[92vw] max-w-[440px]
            -translate-x-1/2 -translate-y-1/2
            rounded-3xl border border-slate-400 bg-white p-5
            shadow-[0_28px_90px_-40px_rgba(15,23,42,0.85)]
            dark:border-white/20 dark:bg-[#0F172A]
            dark:ring-1 dark:ring-white/16
            dark:shadow-[0_34px_120px_-60px_rgba(0,0,0,0.95)]
          "
        >
          <AlertDialog.Cancel asChild>
            <button
              type="button"
              aria-label={cancelLabel}
              className="
                absolute right-4 top-4 z-10
                inline-flex items-center justify-center
                text-neutral-500 hover:text-neutral-800
                dark:text-white/60 dark:hover:text-white
              "
            >
              <Icon icon="mdi:close" className="h-6 w-6" />
            </button>
          </AlertDialog.Cancel>

          <div
            className="
              pointer-events-none absolute inset-0
              bg-[radial-gradient(800px_260px_at_20%_0%,rgba(59,130,246,0.18),transparent_55%)]
              dark:bg-[radial-gradient(800px_260px_at_20%_0%,rgba(56,189,248,0.18),transparent_55%)]
            "
          />
          <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-400 dark:bg-white/20" />

          <div className="relative">
            <AlertDialog.Title className="text-lg md:text-xl font-bold text-blue-700 dark:text-[rgb(var(--hero-b))]">
              {title}
            </AlertDialog.Title>
          </div>

          <AlertDialog.Description className="relative mt-3 text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
            {description}
          </AlertDialog.Description>

          <div className="relative mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <button
                className="
                  rounded-2xl border border-slate-400 bg-white px-3 py-1.5
                  text-xs md:text-sm font-semibold text-neutral-700 hover:bg-neutral-100
                  dark:border-white/20 dark:bg-white/[0.08] dark:text-white/90 dark:hover:bg-white/[0.12]
                "
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className={`
                  rounded-2xl px-3.5 py-1.5 text-xs md:text-sm font-semibold
                  ${actionClasses}
                `}
              >
                {actionLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
