"use client";

import { ProTooltipButton } from "@/components/ProTooltipButton";
import ExtractedText from "./ExtractedText";
import SummarizeButton from "./SummarizeButton";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface Props {
  rawText: string;
  setRawText: (v: string) => void;
  loading: boolean;
  hasSummarized: boolean;
  setTags: (tags: string[]) => void;
  extractionSucceeded: boolean;
  onSummarize: (
    text: string,
    type?: "default" | "short" | "shortest" | "detailed"
  ) => void;
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

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // 1.5초 후 다시 false
    } catch (error) {
      console.error("복사 실패:", error);
    }
  };

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

      <div className="flex flex-col gap-2 relative">
        {/* 복사 버튼 */}
        <div className="absolute top-3 right-5 mt-2 mr-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "복사됨" : "복사"}
          </button>
        </div>

        <ExtractedText value={rawText} onChange={setRawText} />

        {/* 안내 문구 */}
        <div className="flex justify-end">
          <p className="text-xs text-gray-400">
            원문은 별도로 저장되지 않습니다.
          </p>
        </div>

        {!hasSummarized ? (
          <SummarizeButton
            disabled={!extractionSucceeded}
            onSummarize={() => onSummarize(rawText)}
            loading={loading}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-background rounded-2xl p-4">
            {buttons.map((btn, idx) => {
              if (btn.pro) {
                return <ProTooltipButton key={idx} label={btn.label} />;
              }

              return (
                <button
                  key={idx}
                  onClick={() => onSummarize(rawText, btn.type)}
                  className="relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white border border-gray-300 text-black hover:border-black"
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
