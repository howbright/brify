"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { FileWarning, X } from "lucide-react";
import * as React from "react";

interface OcrSuggestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOcrConfirm: () => void; // OCR 시작 콜백
  onOpenOcrHelp: () => void; // "왜 실패했나요?" 열기 콜백
}

export default function OcrSuggestDialog({
  open,
  onOpenChange,
  onOcrConfirm,
  onOpenOcrHelp,
}: OcrSuggestDialogProps) {
  // ✨ 모달이 열릴 때 스크롤 막기
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        

        <AlertDialog.Content
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onOpenChange(false);
            }
          }}
          className="fixed top-1/2 left-1/2 z-50 w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-slate-400 bg-white p-6 shadow-[0_32px_100px_-48px_rgba(15,23,42,0.92)] focus:outline-none dark:border-white/20 dark:bg-[#0F172A] dark:ring-1 dark:ring-white/16 dark:shadow-[0_38px_120px_-60px_rgba(0,0,0,0.96)]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_240px_at_20%_0%,rgba(59,130,246,0.12),transparent_58%)] dark:bg-[radial-gradient(900px_240px_at_20%_0%,rgba(56,189,248,0.14),transparent_58%)]" />
          {/* ✨ 우상단 닫기버튼 */}
          <AlertDialog.Cancel asChild>
            <button
              className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </AlertDialog.Cancel>

          <div className="relative flex items-center gap-3">
            <FileWarning className="h-5 w-5 text-blue-700 dark:text-[rgb(var(--hero-b))]" />
            <AlertDialog.Title className="text-xl font-bold text-blue-700 dark:text-[rgb(var(--hero-b))]">
              PDF에서 텍스트를 추출할 수 없습니다
            </AlertDialog.Title>
          </div>

          <AlertDialog.Description className="mt-4 text-base font-medium leading-7 text-neutral-800 dark:text-neutral-100">
            PDF에서 텍스트를 직접 추출할 수 없습니다.
            <br />
            <br />
            문서 형식이나 인코딩 문제로 인해 OCR(이미지 인식)을 통해 텍스트를
            추출해야 할 수 있습니다.
            <br />
            <br />
            OCR(이미지 인식)으로 텍스트를 추출해보시겠어요?
            <br />
            <button
              onClick={onOpenOcrHelp}
              className="mt-3 inline-block text-sm font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-800 dark:text-[rgb(var(--hero-b))]"
            >
              *PDF 텍스트 추출 실패 이유 알아보기
            </button>
          </AlertDialog.Description>

          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button className="rounded-2xl border border-slate-400 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100 dark:border-white/20 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/10">
                취소
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onOcrConfirm}
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-18px_rgba(37,99,235,0.9)] transition hover:bg-blue-700 dark:bg-[rgb(var(--hero-b))] dark:text-[#081120] dark:hover:bg-[rgb(var(--hero-a))]"
              >
                OCR로 추출 시도하기
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
