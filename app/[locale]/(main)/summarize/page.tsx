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
import SummaryActionsWrapper from "./SummaryActionWrapper";
import SummaryActionsFloating from "./SummaryActionsFloating";
import { getTagsFromText } from "@/app/lib/gtp/getTagsFromText";
import EditableTags from "./EditableTags";

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
  const [tags, setTags] = useState<string[]>([]);

  const handleSummarize = async () => {
    if (!rawText) return;
    setLoading(true);
    try {
      const { text, tree } = await summarizeBoth(rawText);
      setTextSummary(text);
      setTreeSummary(tree);
      const extractedTags = await getTagsFromText(text); // ✅ 태그 추출
      setTags(extractedTags); // ✅ 상태 업데이트
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
        <>
          <motion.section
            className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-10 shadow-md flex flex-col items-center"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="mb-10">
              <EditableTags tags={tags} onChange={setTags} />
            </div>

            {/* 섹션 제목 */}
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-white mb-4 text-center">
              이제 요약 결과를 나만의 정리 스타일로 완성해보세요.
            </h3>

            {/* 요약 콘텐츠 */}
            <div className="w-full">
              <SummaryResult text={textSummary} tree={treeSummary} />
            </div>

            {/* 툴바 */}
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
        </>
      )}
    </div>
  );
}
