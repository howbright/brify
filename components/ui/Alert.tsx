// components/Alert.tsx
"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface AlertProps {
  text: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  confirmLabel?: string;
  variant?: "info" | "success" | "warning" | "error";
}

const VARIANT_STYLE = {
  info: {
    icon: Info,
    iconClass: "text-blue-600",
    panelClass: "border-blue-100 bg-white dark:border-blue-300/20 dark:bg-[#0d1422]",
    buttonClass:
      "bg-slate-950 text-white hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    panelClass:
      "border-emerald-100 bg-white dark:border-emerald-300/20 dark:bg-[#0d1422]",
    buttonClass:
      "bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300",
  },
  warning: {
    icon: AlertCircle,
    iconClass: "text-amber-600",
    panelClass: "border-amber-100 bg-white dark:border-amber-300/20 dark:bg-[#0d1422]",
    buttonClass:
      "bg-amber-600 text-white hover:bg-amber-500 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300",
  },
  error: {
    icon: AlertCircle,
    iconClass: "text-rose-600",
    panelClass: "border-rose-100 bg-white dark:border-rose-300/20 dark:bg-[#0d1422]",
    buttonClass:
      "bg-rose-600 text-white hover:bg-rose-500 dark:bg-rose-400 dark:text-slate-950 dark:hover:bg-rose-300",
  },
} as const;

export default function Alert({
  text,
  open,
  onOpenChange,
  title = "알림",
  confirmLabel = "확인",
  variant = "error",
}: AlertProps) {
  const style = VARIANT_STYLE[variant];
  const Icon = style.icon;
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[520] bg-slate-950/55 backdrop-blur-sm" />
        <AlertDialog.Content
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              onOpenChange(false);
            }
          }}
          autoFocus
          className={[
            "fixed left-1/2 top-1/2 z-[521] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border p-5 shadow-[0_34px_100px_-36px_rgba(0,0,0,0.72)] outline-none",
            style.panelClass,
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10">
              <Icon className={["h-5 w-5", style.iconClass].join(" ")} />
            </div>
            <AlertDialog.Title className="text-lg font-black tracking-normal text-slate-950 dark:text-white">
              {title}
            </AlertDialog.Title>
          </div>
          <AlertDialog.Description className="mt-4 text-sm font-semibold leading-6 text-slate-600 dark:text-white/62">
            {text}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end">
            <AlertDialog.Action asChild>
              <button
                autoFocus
                className={[
                  "inline-flex h-10 items-center rounded-2xl px-4 text-sm font-black transition",
                  style.buttonClass,
                ].join(" ")}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
