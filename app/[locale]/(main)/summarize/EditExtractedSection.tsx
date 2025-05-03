"use client";

import { ProTooltipButton } from "@/components/ProTooltipButton";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import SummarizeButton from "./SummarizeButton";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  isManual: boolean;
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
  isManual,
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
  const [sourceNote, setSourceNote] = useState("");
  const [showSourceInput, setShowSourceInput] = useState(false);
  const isTooShort = rawText.trim().length < 300;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
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
      {isManual ? (
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 text-center">
          요약할 내용을 입력하거나 붙여넣어 보세요.{" "}
          <br className="hidden sm:block" />
          내용이 준비되면 핵심정리를 진행하세요.
        </h3>
      ) : (
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 text-center">
          내용이 준비됐어요. <br className="hidden sm:block" />
          요약하기 전에 편집이 필요하다면 수정해보세요.
        </h3>
      )}

      <div className="relative flex flex-col mb-5 gap-2 p-6 rounded-2xl border border-gray-200 dark:border-white/20  bg-primary/5 dark:bg-[#18181c]">
        {/* 복사 버튼 */}
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "복사됨" : "복사"}
        </button>

        {/* 텍스트 입력 */}
        <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">
          원문 내용
        </label>
        <textarea
          rows={10}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="w-full border border-gray-300 dark:border-white/20 p-4 rounded-lg bg-white dark:bg-black text-sm text-gray-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary"
          placeholder="추출된 내용을 확인하거나 수정할 수 있습니다."
        />

        <p className="text-xs text-gray-400 text-right mt-2">
          요약 결과를 위해 입력한 원문은 하루 동안 임시 보관되며 이후 자동
          삭제돼요.
        </p>
        {isTooShort && (
          <p className="text-xs text-red-500 text-right">
            요약을 위해 최소 300자 이상의 내용을 입력해주세요.
          </p>
        )}
      </div>
      {/* 출처 입력 아코디언 */}
      <div className="my-4">
        <button
          type="button"
          onClick={() => setShowSourceInput(!showSourceInput)}
          className="text-sm text-gray-600 dark:text-gray-300 hover:underline flex items-center gap-1"
        >
          {showSourceInput ? "출처 입력 숨기기" : "출처를 추가로 입력할까요?"}
          {showSourceInput ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>

        {showSourceInput && (
          <div className="mt-3 flex flex-col gap-2 border border-gray-200 dark:border-white/20 bg-primary/5 dark:bg-[#18181c] p-4 rounded-2xl">
            <label className="block text-sm font-medium text-gray-800 dark:text-white mb-1">
              출처 (선택 입력)
            </label>
            <input
              type="text"
              value={sourceNote}
              onChange={(e) => setSourceNote(e.target.value)}
              placeholder="출처를 남기고 싶다면 입력해주세요 (선택사항)"
              className="w-full border border-gray-300 dark:border-white/20 p-3 rounded-lg bg-white dark:bg-black text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
          </div>
        )}
      </div>
      {!hasSummarized ? (
        <SummarizeButton
          disabled={isTooShort || !extractionSucceeded}
          onSummarize={() => onSummarize(rawText)}
          loading={loading}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-background rounded-2xl p-6">
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
    </section>
  );
}
