"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProTooltipButton } from "@/components/ProTooltipButton";
import SummarizeButton from "./SummarizeButton";

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

type SummaryType = "default" | "short" | "shortest" | "detailed";

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
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
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

  const summaryOptions: { label: string; type: SummaryType; pro?: boolean }[] = [
    { label: "더 간단히 요약하기", type: "shortest" },
    { label: "다시 요약하기", type: "default" },
    { label: "더 자세히 요약하기", type: "detailed", pro: true },
  ];

  return (
    <section className="bg-white mt-5 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-10 shadow-md flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 text-center">
        {isManual ? (
          <>
            요약할 내용을 입력하거나 붙여넣어 보세요.
            <br className="hidden sm:block" />
            내용이 준비되면 핵심정리를 진행하세요.
          </>
        ) : (
          <>
            내용이 준비됐어요.
            <br className="hidden sm:block" />
            요약하기 전에 편집이 필요하다면 수정해보세요.
          </>
        )}
      </h3>

      <div className="relative flex flex-col mb-5 gap-2 p-6 rounded-2xl border border-gray-200 dark:border-white/20 bg-primary/5 dark:bg-[#18181c]">
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "복사됨" : "복사"}
        </button>

        <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">
          원문 내용
        </label>
        <textarea
          rows={10}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="w-full border border-gray-300 dark:border-white/20 p-4 rounded-lg bg-white dark:bg-black text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={isManual ? "여기에 정리할 내용을 입력해주세요." : "추출된 내용을 확인하거나 수정할 수 있습니다."}
        />

        <p className="text-xs text-gray-400 text-right mt-2">
          요약 결과를 위해 입력한 원문은 하루 동안 임시 보관되며 이후 자동 삭제돼요.
        </p>
        {isTooShort && (
          <p className="text-xs text-red-500 text-right">
            요약을 위해 최소 300자 이상의 내용을 입력해주세요.
          </p>
        )}
      </div>

      {loading ? (
        <motion.div
          key="loading"
          className="flex flex-col items-center justify-center p-6 gap-3 border border-dashed border-gray-300 rounded-xl bg-white dark:bg-zinc-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-pulse text-center flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              ✏️ 핵심 내용을 분석 중이에요...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI가 중요한 문장을 고르고 정리하는 중입니다.
              <br /> 5~15초 정도 걸릴 수 있어요.
            </p>
          </div>

          <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 12, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      ) : !hasSummarized ? (
        <SummarizeButton
          disabled={isTooShort || !extractionSucceeded}
          onSummarize={() => onSummarize(rawText)}
          loading={false}
        />
      ) : (
        <div className="relative w-full flex flex-col items-center justify-center gap-4">
          <button
            onClick={() => setShowOptions((prev) => !prev)}
            className="w-8 sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold transition bg-white border border-gray-300 text-black hover:border-black"
          >
            다시 요약하기
          </button>

          <AnimatePresence>
            {showOptions && (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {summaryOptions.map((opt, idx) =>
                  opt.pro ? (
                    <ProTooltipButton key={idx} label={opt.label} />
                  ) : (
                    <button
                      key={idx}
                      onClick={() => {
                        setShowOptions(false);
                        onSummarize(rawText, opt.type);
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-gray-50 border border-gray-300 hover:border-black"
                    >
                      {opt.label}
                    </button>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
