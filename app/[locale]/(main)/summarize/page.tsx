"use client";

import { getTagsFromText } from "@/app/lib/gtp/getTagsFromText";
import { summarizeBoth } from "@/app/lib/gtp/summarize";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import EditableTags from "./EditableTags";
import ExtractedText from "./ExtractedText";
import InputSection from "./InputSection";
import SourceTabs from "./SourceTabs";
import SummarizeButton from "./SummarizeButton";
import SummaryActionsFloating from "./SummaryActionsFloating";
import SummaryResult from "./SummaryResult";
import { ProTooltipButton } from "@/components/ProTooltipButton";
import EditExtractedSection from "./EditExtractedSection";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { supabase } from "@/app/lib/supabaseClienet";
import { useLocale } from "next-intl";
import { SourceType } from "@/app/types/sourceType";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function SummarizePage() {
  const locale = useLocale();
  const [sourceType, setSourceType] = useState<SourceType>(SourceType.YOUTUBE);
  const [rawText, setRawText] = useState("");
  const [textSummary, setTextSummary] = useState("");
  const [treeSummary, setTreeSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [hasSummarized, setHasSummarized] = useState(false);
  const [extractionSucceeded, setExtractionSucceeded] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingSourceType, setPendingSourceType] = useState<SourceType | null>(null);

  useEffect(() => {
    if (sourceType === SourceType.MANUAL && !rawText) {
      setRawText("✍️ 여기에 정리할 내용을 입력해주세요.");
      setExtractionSucceeded(true);
    }
  }, [sourceType]);

  const handleSummarize = async (text: string) => {
    if (!text) return;
    setLoading(true);
    try {
      const token = await supabase.auth.getSession().then((res) => res.data.session?.access_token);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalText: text,
          lang: locale,
          sourceType,
          sourceUrl: sourceType === SourceType.YOUTUBE || sourceType === SourceType.WEBSITE ? text : null,
          sourceTitle: null,
          isPublic: false,
          publicComment: null,
        }),
      });

      const data = await res.json();
      console.log("요약 Job 생성됨:", data.summaryId);
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
    setExtractionSucceeded(succeed);
    if (sourceType === SourceType.MANUAL) {
      handleSummarize(text);
    }
  };

  const handleSourceChange = (newType: SourceType) => {
    const hasExistingData = rawText || textSummary || treeSummary;
    if (hasExistingData) {
      setPendingSourceType(newType);
      setConfirmDialogOpen(true);
      return;
    }
    setSourceType(newType);
  };

  const handleConfirmInit = () => {
    setRawText("");
    setTextSummary("");
    setTreeSummary(null);
    setTags([]);
    setHasSummarized(false);
    setExtractionSucceeded(false);
    if (pendingSourceType) {
      setSourceType(pendingSourceType);
      setPendingSourceType(null);
    }
    setConfirmDialogOpen(false);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full max-w-7xl mx-auto px-6 py-12 space-y-12">
        <motion.section
          className="bg-background dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-10 shadow-md space-y-6"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 text-center">
            어떤 내용을 정리할까요? <br className="hidden sm:block" />
            먼저 출처를 골라주세요.
          </h3>

          <div className="flex justify-center">
            <SourceTabs selected={sourceType} onChange={handleSourceChange} />
          </div>

          <div className="flex justify-center">
            <InputSection
              type={sourceType}
              onExtracted={handleExtractedText}
              isLoading={loading}
              setIsLoading={setLoading}
              onManualSubmit={handleSummarize}
            />
            <ConfirmDialog
              open={confirmDialogOpen}
              onOpenChange={setConfirmDialogOpen}
              onConfirm={handleConfirmInit}
            />
          </div>
        </motion.section>

        {rawText && (
          <motion.section variants={fadeInUp} initial="initial" animate="animate">
            <EditExtractedSection
              rawText={rawText}
              setRawText={setRawText}
              loading={loading}
              hasSummarized={hasSummarized}
              setTags={setTags}
              extractionSucceeded={extractionSucceeded}
              onSummarize={handleSummarize}
              isManual={sourceType === SourceType.MANUAL}
            />
          </motion.section>
        )}

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
