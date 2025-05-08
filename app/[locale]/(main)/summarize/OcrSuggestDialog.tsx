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
          className="fixed top-1/2 left-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl border border-primary z-50"
        >
          {/* ✨ 우상단 닫기버튼 */}
          <AlertDialog.Cancel asChild>
            <button
              className="absolute top-4 right-4 rounded-full p-1 text-gray-500 hover:text-gray-900"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </AlertDialog.Cancel>

          <div className="flex items-center space-x-3">
            <FileWarning className="text-primary" />
            <AlertDialog.Title className="ml-2 text-lg font-semibold text-gray-900">
              PDF에서 텍스트를 추출할 수 없습니다
            </AlertDialog.Title>
          </div>

          <AlertDialog.Description className="mt-4 text-sm text-gray-700 leading-relaxed">
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
              className="mt-3 inline-block text-xs text-primary underline hover:text-primary-dark"
            >
              *PDF 텍스트 추출 실패 이유 알아보기
            </button>
          </AlertDialog.Description>

          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
                취소
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onOcrConfirm}
                className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 text-white text-sm font-semibold transition"
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
