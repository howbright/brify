"use client";

import { getTagsFromText } from "@/app/lib/gtp/getTagsFromText";
import { summarizeBoth } from "@/app/lib/gtp/summarize";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { motion } from "framer-motion";
import { useState } from "react";
import EditableTags from "./EditableTags";
import ExtractedText from "./ExtractedText";
import InputSection from "./InputSection";
import SourceTabs, { SourceType } from "./SourceTabs";
import SummarizeButton from "./SummarizeButton";
import SummaryActionsFloating from "./SummaryActionsFloating";
import SummaryResult from "./SummaryResult";
import { ProTooltipButton } from "@/components/ProTooltipButton";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function SummarizePage() {
  const [sourceType, setSourceType] = useState<SourceType>("youtube");
  const [rawText, setRawText] = useState("");
  const [textSummary, setTextSummary] = useState("");
  const [treeSummary, setTreeSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [hasSummarized, setHasSummarized] = useState(false);
  const [extractionSucceeded, setExtractionSucceeded] = useState(false);

  type SummaryType = "default" | "short" | "shortest" | "detailed";

  const buttons: { label: string; type: SummaryType; pro: boolean }[] = [
    { label: "한 문장 요약", type: "shortest", pro: true },
    { label: "더 간단히 요약", type: "short", pro: true },
    { label: "다시 요약하기", type: "default", pro: false },
    { label: "더 자세히 요약", type: "detailed", pro: true },
  ];

  const handleSummarize = async (
    text: string,
    type: "default" | "short" | "shortest" | "detailed" = "default"
  ) => {
    if (!text) return;
    setLoading(true);
    try {
      const { text: summary, tree } = await summarizeBoth(text); // 실제 요약 함수
      setTextSummary(summary);
      setTreeSummary(tree);
      const extractedTags = await getTagsFromText(summary);
      setTags(extractedTags);
      setHasSummarized(true);
    } catch (e) {
      console.error("요약 중 오류 발생:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractedText = (text: string, succeed: boolean) => {
    setRawText(text);
    setTextSummary("");
    setTreeSummary(null);
    setTags([]);
    setHasSummarized(false);
    setExtractionSucceeded(succeed); // ✅ 더 자연스럽고 정확한 표현
    if (sourceType === "manual") {
      handleSummarize(text);
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Section 1: 입력 */}
        <motion.section
          className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-10 shadow-md space-y-6"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 text-center">
            어떤 내용을 정리할까요? <br className="hidden sm:block" />
            먼저 출처를 골라주세요.
          </h3>

          <div className="flex justify-center">
            <SourceTabs selected={sourceType} onChange={setSourceType} />
          </div>

          <div className="flex justify-center">
            <InputSection
              type={sourceType}
              onExtracted={handleExtractedText}
              isLoading={loading}
              setIsLoading={setLoading}
              onManualSubmit={handleSummarize}
            />
          </div>
        </motion.section>

        {/* Section 2: 원문 편집 */}
        {rawText && sourceType !== "manual" && (
          <motion.section
            className="bg-white mt-7 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-10 shadow-md space-y-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 text-center">
              추출된 내용을 확인하고, <br className="hidden sm:block" />
              필요하다면 수정해보세요.
            </h3>

            <div className="space-y-6">
              <ExtractedText value={rawText} onChange={setRawText} />

              {!hasSummarized ? (
                <SummarizeButton
                  disabled={!extractionSucceeded}
                  onSummarize={() => handleSummarize(rawText)}
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
                        onClick={() => handleSummarize(rawText, btn.type)} // ✅ 이제 타입 오류 없음!
                        className="border border-gray-200 dark:border-white/10 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition text-gray-800 dark:text-white"
                      >
                        {btn.label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Section 3: 요약 결과 */}
        {textSummary && treeSummary && (
          <motion.section
            className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-10 shadow-md flex flex-col items-center"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="mb-10">
              <EditableTags tags={tags} onChange={setTags} />
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-white mb-4 text-center">
              이제 요약 결과를 나만의 정리 스타일로 완성해보세요.
            </h3>

            <div className="w-full">
              <SummaryResult text={textSummary} tree={treeSummary} />
            </div>

            <SummaryActionsFloating
              mode="text"
              text={textSummary}
              onHighlight={() => console.log("하이라이트")}
              onRegenerate={(level) => console.log("다시 요약:", level)}
              onExplainTerms={() => console.log("전문 용어 정리")}
              onExportPDF={() => console.log("PDF 저장")}
              onAskGPT={() => console.log("GPT 질문")}
              onCopy={(t) => navigator.clipboard.writeText(t)}
              targetId="textView"
            />
          </motion.section>
        )}
      </div>
    </TooltipProvider>
  );
}
