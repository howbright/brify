"use client";

import SummarizeButton from "./SummarizeButton";
import ExtractedText from "./ExtractedText";
import { Icon } from "@iconify/react";
import clsx from "clsx";

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-background rounded-2xl p-4">
            {buttons.map((btn, idx) => {
              const isRetry = btn.type === "default";

              return (
                <button
                  key={idx}
                  onClick={() => onSummarize(rawText, btn.type)}
                  className={clsx(
                    "relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 group",
                     "bg-white border border-gray-300 text-black hover:border-black"
                  )}
                >
                  {btn.label}

                  {btn.pro && (
                    <span className="absolute -top-2 -right-2 bg-pink-600 text-[10px] font-bold text-white px-1.5 py-[1px] rounded-full shadow-sm">
                      PRO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
