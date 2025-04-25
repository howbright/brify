// components/Alert.tsx
"use client";

import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertCircle } from "lucide-react";

interface AlertProps {
  text: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Alert({ text, open, onOpenChange }: AlertProps) {

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Content
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              onOpenChange(false);
            }
          }}
          autoFocus
          className="fixed top-1/2 left-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#fff7f7] p-6 shadow-2xl border border-[#ff4d4f]"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="text-[#ff4d4f]" />
            <AlertDialog.Title className="text-lg font-semibold text-[#2c2c2c]">
              알림
            </AlertDialog.Title>
          </div>
          <AlertDialog.Description className="mt-4 text-[#2c2c2c]">
            {text}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end">
            <AlertDialog.Action asChild>
              <button autoFocus className="rounded bg-[#ff4d4f] px-4 py-2 text-white hover:bg-[#d9363e]">
                확인
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
