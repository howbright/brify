"use client";

import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type TermItem = { term: string; meaning: string; isNew?: boolean };

type Mode = "auto" | "custom";

export default function TermsBlock({
  terms,
  loading,
  error,
  usedCount,
  onAutoExtract,
  onExplainCustom,
  onDeleteTerm,
}: {
  terms: TermItem[];
  loading: boolean;
  error?: string | null;
  usedCount: number;
  onAutoExtract: () => void;
  onExplainCustom: (termsCsv: string) => void;
  onDeleteTerm?: (term: string) => void;
}) {
  const t = useTranslations("TermsBlock");
  const hasTerms = terms.length > 0;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [custom, setCustom] = useState("");
  const [customInlineOpen, setCustomInlineOpen] = useState(false);

  const cleanedCsv = useMemo(() => {
    return custom
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12)
      .join(", ");
  }, [custom]);

  const canSubmit =
    !loading && (mode === "auto" || (mode === "custom" && cleanedCsv.length > 0));
  const canCustomSubmit = !loading && cleanedCsv.length > 0;

  const handleOpen = () => {
    if (loading) return;
    setPickerOpen(true);
    setMode(null);
    setCustom("");
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (mode === "auto") onAutoExtract();
    if (mode === "custom") onExplainCustom(cleanedCsv);
    setPickerOpen(false);
    setCustomInlineOpen(false);
  };

  const handleCustomSubmit = () => {
    if (!canCustomSubmit) return;
    onExplainCustom(cleanedCsv);
    setCustomInlineOpen(false);
  };

  const helperText = t("helper");

  return (
    <div className="flex flex-col gap-3">
      {helperText?.trim() ? (
        <div className="text-xs text-neutral-500 dark:text-white/60">
          {helperText}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400" />
            {t("loading")}
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/70 dark:bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {hasTerms && (
        <>
          <div className="sticky top-[-16px] z-30 -mx-4 px-4 py-2 bg-white dark:bg-[#0b1220] border-b border-neutral-200/80 dark:border-white/10 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
            <button
              type="button"
              onClick={() => setCustomInlineOpen((v) => !v)}
              className="
                group inline-flex w-full items-center justify-between gap-2
                rounded-2xl border border-blue-200/70
                bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500
                px-3 py-2 text-xs font-semibold text-white
                shadow-[0_10px_30px_rgba(59,130,246,0.25)]
                hover:shadow-[0_14px_40px_rgba(79,70,229,0.45)]
                transition-all duration-150
              "
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-white/15 shadow-sm">
                  <Icon icon="mdi:form-textbox" className="h-3.5 w-3.5" />
                </span>
                {t("customInline.toggle")}
              </span>
              <Icon icon="mdi:chevron-up" className="h-4 w-4 opacity-90" />
            </button>

            {customInlineOpen && (
              <div className="mt-3 rounded-2xl border border-blue-200/60 bg-white p-3 shadow-[0_8px_24px_rgba(59,130,246,0.12)] dark:border-blue-500/30 dark:bg-[#0b1220]">
                <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                  {t("customInline.title")}
                </div>
                <div className="mt-1 text-xs text-neutral-600 dark:text-white/70">
                  {t("customInline.description")}
                </div>
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCustomSubmit();
                    }
                  }}
                  placeholder={t("customInline.placeholder")}
                  className="
                    mt-3 w-full rounded-2xl border border-blue-200/70 bg-white px-3 py-2
                    text-sm text-neutral-900 placeholder:text-neutral-400
                    outline-none focus:ring-2 focus:ring-blue-200
                    dark:border-blue-500/30 dark:bg-white/[0.06]
                    dark:text-white dark:placeholder:text-white/35
                    dark:focus:ring-blue-500/25
                  "
                />
                <div className="mt-3 flex items-center justify-between">
                  {usedCount > 0 ? (
                    <div className="text-[11px] text-neutral-500 dark:text-white/50">
                      {t("usedCount", { count: usedCount })}
                    </div>
                  ) : (
                    <div />
                  )}
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={!canCustomSubmit}
                    className="
                      inline-flex items-center gap-1.5 rounded-2xl
                      border border-blue-200 bg-blue-600 px-3 py-2
                      text-xs font-semibold text-white
                      hover:bg-blue-700
                      disabled:cursor-not-allowed disabled:opacity-60
                      dark:border-blue-500/30 dark:bg-blue-500
                    "
                  >
                    <Icon icon="mdi:send" className="h-4 w-4" />
                    {t("customInline.submit")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {terms.map((x, idx) => (
              <div
                key={idx}
                className={[
                  "rounded-2xl border p-3 transition-colors duration-300",
                  x.isNew
                    ? "border-blue-200/80 bg-blue-50/70 dark:border-blue-500/30 dark:bg-blue-500/10"
                    : "border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.06]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-neutral-900 dark:text-white">
                    {x.term}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteTerm?.(x.term)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-neutral-200 text-neutral-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:border-white/10 dark:text-white/45 dark:hover:text-rose-300 dark:hover:border-rose-500/25 dark:hover:bg-rose-500/10"
                    title={t("delete")}
                    aria-label={t("delete")}
                  >
                    <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1 text-sm text-neutral-700 dark:text-white/80">
                  {x.meaning}
                </div>
              </div>
            ))}
          </div>

        </>
      )}

      {!hasTerms && (
        <button
          type="button"
          onClick={handleOpen}
          className="
            group inline-flex items-center gap-2
            rounded-2xl px-3 py-2 text-xs font-semibold
            text-white
            bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500
            shadow-[0_10px_30px_rgba(37,99,235,0.30)]
            hover:shadow-[0_14px_40px_rgba(79,70,229,0.55)]
            transition-all duration-150
            hover:-translate-y-0.5 hover:scale-[1.02] active:scale-100
          "
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-white/15 shadow-sm">
            <Icon icon="mdi:sparkles" className="h-3.5 w-3.5" />
          </span>
          {t("cta")}
        </button>
      )}

      {!hasTerms && pickerOpen && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="text-xs font-semibold text-neutral-900 dark:text-white">
            {t("picker.title")}
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setMode("auto")}
              className={[
                "rounded-2xl border p-3 text-left text-sm",
                mode === "auto"
                  ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100"
                  : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:hover:bg-white/[0.08]",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 font-semibold">
                <Icon icon="mdi:auto-fix" className="h-4 w-4" />
                {t("picker.auto.title")}
              </div>
              <div className="mt-1 text-xs text-neutral-600 dark:text-white/60">
                {t("picker.auto.description")}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("custom")}
              className={[
                "rounded-2xl border p-3 text-left text-sm",
                mode === "custom"
                  ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100"
                  : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:hover:bg-white/[0.08]",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 font-semibold">
                <Icon icon="mdi:form-textbox" className="h-4 w-4" />
                {t("picker.custom.title")}
              </div>
              <div className="mt-1 text-xs text-neutral-600 dark:text-white/60">
                {t("picker.custom.description")}
              </div>
            </button>
          </div>

          {mode === "custom" && (
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={t("picker.custom.placeholder")}
              className="
                mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2
                text-sm text-neutral-900 placeholder:text-neutral-400
                dark:border-white/10 dark:bg-white/[0.06]
                dark:text-white dark:placeholder:text-white/35
              "
            />
          )}

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:text-white/60 dark:hover:text-white/85"
            >
              {t("picker.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="
                inline-flex items-center gap-1.5 rounded-2xl
                border border-blue-200 bg-blue-600 px-3 py-2
                text-xs font-semibold text-white
                hover:bg-blue-700
                disabled:cursor-not-allowed disabled:opacity-60
                dark:border-blue-500/30 dark:bg-blue-500
              "
            >
              <Icon icon={mode === "custom" ? "mdi:send" : "mdi:sparkles"} className="h-4 w-4" />
              {t("picker.submit")}
            </button>
          </div>
          {usedCount > 0 ? (
            <div className="mt-2 text-[11px] text-neutral-500 dark:text-white/50">
              {t("usedCount", { count: usedCount })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
