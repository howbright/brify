"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type TagEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftTitle: string;
  initialTags: string[];
  allTags: string[];
  saving: boolean;
  onSave: (tags: string[]) => void;
};

export default function TagEditDialog({
  open,
  onOpenChange,
  draftTitle,
  initialTags,
  allTags,
  saving,
  onSave,
}: TagEditDialogProps) {
  const [input, setInput] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [composing, setComposing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const initialKey = useMemo(() => initialTags.join("|"), [initialTags]);

  useEffect(() => {
    if (!open) return;
    setItems(initialTags);
    setInput("");
    setPickerOpen(false);
    setSearchTerm("");
  }, [open, initialKey, initialTags]);

  const handleAdd = () => {
    const next = input.trim();
    if (!next) return;
    setItems((prev) => (prev.includes(next) ? prev : [...prev, next]));
    setInput("");
  };

  const suggestions = useMemo(() => {
    const term = input.trim().toLowerCase();
    if (!term) return [];
    return allTags
      .filter((tag) => !items.includes(tag))
      .filter((tag) => tag.toLowerCase().includes(term))
      .slice(0, 8);
  }, [allTags, input, items]);

  const pickerCandidates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allTags
      .filter((tag) => !items.includes(tag))
      .filter((tag) => (term ? tag.toLowerCase().includes(term) : true));
  }, [allTags, items, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-blue-700 dark:text-[rgb(var(--hero-b))]">
              태그 편집
            </h3>
            <p className="mt-3 text-base font-semibold text-neutral-900 dark:text-white">
              태그를 입력하고 엔터로 추가하세요.
            </p>
          </div>
            <div className="flex flex-col gap-2">
              <label className="text-base font-semibold text-neutral-900 dark:text-white">
                {draftTitle}
              </label>
              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-400 bg-white px-3 py-2 text-sm text-neutral-900 focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-200/70 dark:border-white/20 dark:bg-white/[0.08] dark:text-white dark:focus-within:border-white dark:focus-within:ring-white/20">
                {items.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-400 bg-white px-2 py-0.5 text-xs font-semibold text-neutral-700 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/85"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() =>
                        setItems((prev) => prev.filter((t) => t !== tag))
                      }
                      className="text-neutral-400 hover:text-neutral-700 dark:text-white/50 dark:hover:text-white"
                      aria-label="태그 삭제"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onCompositionStart={() => setComposing(true)}
                  onCompositionEnd={() => setComposing(false)}
                  onKeyDown={(event) => {
                    if (composing || event.nativeEvent.isComposing) return;
                    if (event.key !== "Enter" && event.key !== ",") return;
                    event.preventDefault();
                    handleAdd();
                  }}
                  placeholder="태그 추가"
                  className="min-w-[120px] flex-1 border-0 bg-transparent px-0 py-0 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white dark:placeholder:text-white/40"
                />
              </div>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setItems((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
                      }
                      className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPickerOpen((prev) => !prev)}
                  className="text-sm font-semibold text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white"
                >
                  기존 태그에서 추가
                </button>
                <span className="text-[11px] text-neutral-400 dark:text-white/40">
                  {items.length}개 선택됨
                </span>
              </div>
              {pickerOpen && (
                <div className="rounded-2xl border border-slate-400 bg-white p-3 text-xs text-neutral-700 shadow-sm dark:border-white/20 dark:bg-white/[0.08] dark:text-white/80">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="태그 검색"
                    className="w-full rounded-full border border-slate-400 bg-white px-3 py-1 text-xs text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-white/20 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-white/40 dark:focus:border-white"
                  />
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {pickerCandidates.length === 0 ? (
                        <span className="text-[11px] text-neutral-400 dark:text-white/50">
                          추가할 태그가 없어요.
                        </span>
                      ) : (
                        pickerCandidates.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setItems((prev) =>
                                prev.includes(tag) ? prev : [...prev, tag]
                              )
                            }
                            className="rounded-full border border-slate-400 bg-white px-2 py-0.5 text-[11px] text-neutral-700 hover:bg-neutral-100 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/80 dark:hover:bg-white/10"
                          >
                            #{tag}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border border-slate-400 bg-white px-3 py-1.5 text-xs md:text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/90 dark:hover:bg-white/[0.12]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => onSave(items)}
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--hero-b))] dark:hover:bg-[rgb(var(--hero-a))] dark:text-neutral-950"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
