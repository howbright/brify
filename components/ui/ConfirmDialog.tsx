"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertCircle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  actionLabel?: string;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "초기화할까요?",
  description = "진행 중이던 내용이 모두 사라집니다.",
  actionLabel = "초기화"
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/20" />
        <AlertDialog.Content
          className="fixed top-1/2 left-1/2 w-96 max-w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl border border-gray-300"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            <AlertDialog.Title className="text-lg font-semibold text-gray-900">
              {title}
            </AlertDialog.Title>
          </div>
          <AlertDialog.Description className="mt-4 text-gray-700">
            {description}
          </AlertDialog.Description>

          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">
                취소
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className="rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
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
