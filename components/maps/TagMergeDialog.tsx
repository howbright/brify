"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type TagMergeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTags: string[];
  onConfirm: (targetTag: string) => void;
};

export default function TagMergeDialog({
  open,
  onOpenChange,
  selectedTags,
  onConfirm,
}: TagMergeDialogProps) {
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (!open) return;
    setTarget(selectedTags[0] ?? "");
  }, [open, selectedTags]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              태그 합치기
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-white/60">
              선택한 태그를 하나로 통합합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTarget(tag)}
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                  target === tag
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                } dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20`}
              >
                #{tag}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-neutral-700 dark:text-white/80">
              기준 태그
            </label>
            <input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="합칠 태그 이름"
              className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200/70 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/40 dark:focus:border-white dark:focus:ring-white/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
            >
              닫기
            </button>
            <button
              type="button"
              disabled={target.trim().length === 0}
              onClick={() => onConfirm(target.trim())}
              className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90"
            >
              합치기
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
