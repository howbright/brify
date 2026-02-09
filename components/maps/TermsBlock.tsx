"use client";

import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

type TermItem = { term: string; meaning: string };

type Mode = "auto" | "custom";

export default function TermsBlock({
  terms,
  loading,
  usedCount,
  onAutoExtract,
  onExplainCustom,
}: {
  terms: TermItem[];
  loading: boolean;
  usedCount: number;
  onAutoExtract: () => void;
  onExplainCustom: (termsCsv: string) => void;
}) {
  const hasTerms = terms.length > 0;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [custom, setCustom] = useState("");

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
  };

  const handleCustomSubmit = () => {
    if (!canCustomSubmit) return;
    onExplainCustom(cleanedCsv);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-neutral-500 dark:text-white/60">
        어려운 용어가 자동으로 정리돼요.
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
          용어 해설 생성 중…
        </div>
      ) : hasTerms ? (
        <div className="flex flex-col gap-2">
          {terms.map((x) => (
            <div
              key={x.term}
              className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.06]"
            >
              <div className="font-semibold text-neutral-900 dark:text-white">
                {x.term}
              </div>
              <div className="mt-1 text-sm text-neutral-700 dark:text-white/80">
                {x.meaning}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {hasTerms && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="text-xs font-semibold text-neutral-900 dark:text-white">
            추가로 해설 받고 싶은 용어가 있나요?
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-white/60">
            쉼표로 구분해 입력하면 해당 용어만 해설해줘요.
          </div>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="예: JWT, CORS, OAuth"
            className="
              mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2
              text-sm text-neutral-900 placeholder:text-neutral-400
              dark:border-white/10 dark:bg-white/[0.06]
              dark:text-white dark:placeholder:text-white/35
            "
          />
          <div className="mt-3 flex items-center justify-between">
            {usedCount > 0 ? (
              <div className="text-[11px] text-neutral-500 dark:text-white/50">
                이 세션에서 {usedCount}회 사용했어요.
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
              용어 해설 받기
            </button>
          </div>
        </div>
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
          AI 용어 해설
        </button>
      )}

      {!hasTerms && pickerOpen && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="text-xs font-semibold text-neutral-900 dark:text-white">
            어떤 방식으로 해설을 받을까요?
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
                전체 용어 해설
              </div>
              <div className="mt-1 text-xs text-neutral-600 dark:text-white/60">
                AI가 용어를 자동으로 추출해서 핵심만 정리해줘요.
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
                내가 원하는 용어만
              </div>
              <div className="mt-1 text-xs text-neutral-600 dark:text-white/60">
                원하는 용어를 쉼표로 구분해 입력해요.
              </div>
            </button>
          </div>

          {mode === "custom" && (
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="예: JWT, CORS, OAuth"
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
              취소
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
              시작하기
            </button>
          </div>
          {usedCount > 0 ? (
            <div className="mt-2 text-[11px] text-neutral-500 dark:text-white/50">
              이 세션에서 {usedCount}회 사용했어요.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
