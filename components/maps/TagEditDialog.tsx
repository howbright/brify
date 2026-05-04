"use client";

import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { appendParsedTags, normalizeTags, shouldCommitTagKey } from "@/utils/tags";

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
  const t = useTranslations("TagEditDialog");
  const [input, setInput] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [composing, setComposing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const initialKey = useMemo(() => initialTags.join("|"), [initialTags]);

  useEffect(() => {
    if (!open) return;
    setItems(normalizeTags(initialTags));
    setInput("");
    setPickerOpen(false);
    setSearchTerm("");
  }, [open, initialKey, initialTags]);

  const handleAdd = (rawValue?: unknown) => {
    const next = String(rawValue ?? input ?? "");
    if (!next.trim()) return;
    setItems((prev) => appendParsedTags(prev, next));
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
              {t("title")}
            </h3>
            <p className="mt-3 text-base font-semibold text-neutral-900 dark:text-white">
              {t("description")}
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-400 bg-white px-3 py-1 text-[14px] font-semibold text-neutral-700 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/85"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() =>
                        setItems((prev) => prev.filter((t) => t !== tag))
                      }
                      className="text-neutral-400 hover:text-neutral-700 dark:text-white/50 dark:hover:text-white"
                      aria-label={t("removeTagAria")}
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
                    if (!shouldCommitTagKey(event.key)) return;
                    event.preventDefault();
                    handleAdd(event.currentTarget.value);
                  }}
                  onBlur={(event) => {
                    if (!event.currentTarget.value.trim()) return;
                    handleAdd(event.currentTarget.value);
                  }}
                  onPaste={(event) => {
                    const pasted = event.clipboardData.getData("text");
                    if (!pasted) return;
                    if (!/[,\n\r;|#\t]/.test(pasted)) return;
                    event.preventDefault();
                    handleAdd(pasted);
                  }}
                  placeholder={t("addTagPlaceholder")}
                  className="min-w-[140px] flex-1 border-0 bg-transparent px-0 py-0 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white dark:placeholder:text-white/40"
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
                      className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-[13px] font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20"
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
                  className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-blue-700 hover:text-blue-800 dark:text-[rgb(var(--hero-b))] dark:hover:text-[rgb(var(--hero-a))]"
                >
                  {t("addFromExisting")}
                  <Icon
                    icon="mdi:chevron-down"
                    className={`h-4.5 w-4.5 transition-transform ${pickerOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <span className="text-[14px] font-medium text-neutral-500 dark:text-white/50">
                  {t("selectedCount", { count: items.length })}
                </span>
              </div>
              {pickerOpen && (
                <div className="rounded-2xl border border-slate-400 bg-white p-3 text-sm text-neutral-700 shadow-sm dark:border-white/20 dark:bg-white/[0.08] dark:text-white/80">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full rounded-full border border-slate-400 bg-white px-3 py-2 text-[15px] text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-white/20 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-white/40 dark:focus:border-white"
                  />
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {pickerCandidates.length === 0 ? (
                        <span className="text-[14px] text-neutral-400 dark:text-white/50">
                          {t("noTagsToAdd")}
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
                            className="rounded-full border border-slate-400 bg-white px-3 py-1 text-[14px] text-neutral-700 hover:bg-neutral-100 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/80 dark:hover:bg-white/10"
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
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={() => onSave(items)}
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--hero-b))] dark:hover:bg-[rgb(var(--hero-a))] dark:text-neutral-950"
            >
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
