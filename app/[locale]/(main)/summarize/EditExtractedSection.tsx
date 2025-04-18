"use client";

import { useState } from "react";
import SummarizeButton from "./SummarizeButton";
import EditableTags from "./EditableTags";
import ExtractedText from "./ExtractedText";
import { ProTooltipButton } from "@/components/ProTooltipButton";

interface Props {
  rawText: string;
  setRawText: (v: string) => void;
  loading: boolean;
  hasSummarized: boolean;
  setTags: (tags: string[]) => void;
  extractionSucceeded: boolean;
  onSummarize: (text: string, type?: "default" | "short" | "shortest" | "detailed") => void;
}

export default function EditExtractedSection({
  rawText,
  setRawText,
  loading,
  hasSummarized,
  setTags,
  extractionSucceeded,
  onSummarize,
}: Props) {
  type SummaryType = "default" | "short" | "shortest" | "detailed";

  const buttons: { label: string; type: SummaryType; pro: boolean }[] = [
    { label: "한 문장 요약", type: "shortest", pro: true },
    { label: "더 간단히 요약", type: "short", pro: true },
    { label: "다시 요약하기", type: "default", pro: false },
    { label: "더 자세히 요약", type: "detailed", pro: true },
  ];

  return (
    <section className="bg-white mt-5 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-10 shadow-md space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 text-center">
        추출된 내용을 확인하고, <br className="hidden sm:block" />
        필요하다면 수정해보세요.
      </h3>

      <div className="flex flex-col gap-6">
        <ExtractedText value={rawText} onChange={setRawText} />

        {!hasSummarized ? (
          <SummarizeButton
            disabled={!extractionSucceeded}
            onSummarize={() => onSummarize(rawText)}
            loading={loading}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {buttons.map((btn, idx) =>
              btn.pro ? (
                <ProTooltipButton key={idx} label={btn.label} />
              ) : (
                <button
                  key={idx}
                  onClick={() => onSummarize(rawText, btn.type)}
                  className="border border-gray-200 dark:border-white/10 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition text-gray-800 dark:text-white"
                >
                  {btn.label}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
