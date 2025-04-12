"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SourceTabs, { SourceType } from "./SourceTabs";
import InputSection from "./InputSection";
import ExtractedText from "./ExtractedText";
import SummarizeButton from "./SummarizeButton";
import SummaryResult from "./SummaryResult";
import { summarizeBoth } from "@/app/lib/gtp/summarize";
import SummaryActions from "./SummaryActions";

// 애니메이션 설정
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

  const handleSummarize = async () => {
    if (!rawText) return;
    setLoading(true);
    try {
      const { text, tree } = await summarizeBoth(rawText);
      setTextSummary(text);
      setTreeSummary(tree);
    } catch (e) {
      console.error("요약 중 오류 발생:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Section 1: 소스 선택 + 입력 */}
      <motion.section
        className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-10 shadow-md space-y-6"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        {/* 제목 */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 text-center">
          어떤 내용을 정리할까요? <br className="hidden sm:block" />
          먼저 출처를 골라주세요.
        </h3>

        {/* 탭 */}
        <div className="flex justify-center">
          <SourceTabs selected={sourceType} onChange={setSourceType} />
        </div>

        {/* 입력 */}
        <div className="flex justify-center">
          <InputSection
            type={sourceType}
            onExtracted={(text) => setRawText(text)}
            isLoading={loading}
            setIsLoading={setLoading}
          />
        </div>
      </motion.section>

      {/* Section 2: 원문 편집 */}
      {rawText && (
        <motion.section
          className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-10 shadow-md space-y-6"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          {/* 제목 */}
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 text-center">
            추출된 내용을 확인하고, <br className="hidden sm:block" />
            필요하다면 수정해보세요.
          </h3>

          <div className="space-y-6">
            <ExtractedText value={rawText} onChange={setRawText} />
            <SummarizeButton onSummarize={handleSummarize} loading={loading} />
          </div>
        </motion.section>
      )}

      {/* Section 3: 요약 결과 */}
      {textSummary && treeSummary && (
        <motion.section
          className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-10 shadow-md"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-white mb-4 text-center">
            이제 요약 결과를 나만의 정리 스타일로 완성해보세요.
          </h3>

          <SummaryResult text={textSummary} tree={treeSummary} />
        </motion.section>
      )}
      {textSummary && treeSummary && (
        <motion.div
          className="fixed bottom-6 inset-x-4 sm:inset-x-8 z-50"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl px-4 py-3 flex flex-wrap justify-center gap-3 overflow-x-auto">
            <SummaryActions
              mode="text"
              text={textSummary}
              onHighlight={() => console.log("✨ 하이라이트!")}
              onRegenerate={(level) => console.log("🔄 다시 요약:", level)}
              onExplainTerms={() => console.log("📘 전문 용어 정리")}
              onExportPDF={() => console.log("📄 PDF로 저장")}
              onAskGPT={() => console.log("💬 GPT에게 질문")}
              onCopy={(t) => navigator.clipboard.writeText(t)}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
