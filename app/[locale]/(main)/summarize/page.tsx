"use client";

import { supabase } from "@/app/lib/supabaseClienet";
import { SourceType } from "@/app/types/sourceType";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import EditableTags from "./EditableTags";
import EditExtractedSection from "./EditExtractedSection";
import InputSection from "./InputSection";
import SourceTabs from "./SourceTabs";
import SummaryActionsFloating from "./SummaryActionsFloating";
import SummaryResult from "./SummaryResult";
import LoginRequiredDialog from "./LoginRequiredDialog";
import { useSession } from "@/components/SessionProvider";
import { TreeNode } from "@/app/types/tree";
import { convertToTree } from "@/app/lib/gtp/convertToTree";
import { useSummarizeMutation } from "@/app/hooks/useSummaryMutation";
import { useSummaryStatus } from "@/app/hooks/useSummaryStatus";
import { toast } from "sonner";

const LOCAL_STORAGE_KEY = "brify:pendingInput";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function SummarizePage() {
  const locale = useLocale();
  const { session } = useSession();
  const [sourceType, setSourceType] = useState<SourceType>(SourceType.YOUTUBE);
  const [rawText, setRawText] = useState("");
  const [textSummary, setTextSummary] = useState("");
  const [treeSummary, setTreeSummary] = useState<TreeNode | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [hasSummarized, setHasSummarized] = useState(false);
  const [extractionSucceeded, setExtractionSucceeded] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingSourceType, setPendingSourceType] = useState<SourceType | null>(
    null
  );
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [summaryId, setSummaryId] = useState<string | null>(null);

  const summarizeMutation = useSummarizeMutation();
  const summaryStatus = useSummaryStatus(summaryId);
  const [extracting, setExtracting] = useState(false); // 텍스트 추출 로딩 전용
  const [summaryStatusStarted, setSummaryStatusStarted] = useState(false);

  useEffect(() => {
    if (summaryId && !summaryStatusStarted) {
      setSummaryStatusStarted(true);
    }
  }, [summaryId]);

  const pollingFinished =
  summaryStatus.data?.status === "completed" ||
  summaryStatus.data?.status === "failed";

  const loading = summarizeMutation.isPending || (summaryStatusStarted && !pollingFinished);

  useEffect(() => {
    if (sourceType === SourceType.MANUAL && !rawText) {
      setRawText(
        "\u270d\ufe0f \uc5ec\uae30\uc5d0 \uc815\ub9ac\ud560 \ub0b4\uc6a9\uc744 \uc785\ub825\ud574\uc8fc\uc138\uc694."
      );
      setExtractionSucceeded(true);
    }
  }, [sourceType]);

  useEffect(() => {
    if (!summaryStatus.data) return;

    if (summaryStatus.data.status === "completed") {
      setTextSummary(
        summaryStatus.data.detailedSummaryText ??
          summaryStatus.data.summaryText ??
          ""
      );
      setTreeSummary(convertToTree(summaryStatus.data.treeSummary));
      setHasSummarized(true);
    } else if (summaryStatus.data.status === "failed") {
      toast.error(
        summaryStatus.data.errorMessage ||
          "\uc694\uc57d\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4."
      );
    }
  }, [summaryStatus.data]);

  useEffect(() => {
    const runPendingSummarization = async () => {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved && session?.access_token) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        handleSummarize(saved);
      }
    };
    supabase.auth.getSession().then((res) => {
      const user = res.data.session?.user;
      if (user) runPendingSummarization();
    });
  }, [session]);

  const handleSummarize = (text: string) => {
    if (!text) return;

    summarizeMutation.mutate(
      {
        originalText: text,
        lang: locale,
        sourceType,
        sourceUrl:
          sourceType === SourceType.YOUTUBE || sourceType === SourceType.WEBSITE
            ? text
            : null,
        token: session?.access_token,
      },
      {
        onSuccess: (data) => {
          setSummaryId(data.summaryId);
        },
        onError: (err: any) => {
          if (err.message === "Unauthorized") {
            localStorage.setItem(LOCAL_STORAGE_KEY, text);
            setLoginDialogOpen(true);
          } else {
            toast.error(err.message);
          }
        },
      }
    );
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

  useEffect(() => {
    if (sourceType === SourceType.MANUAL && !rawText) {
      setRawText("");
      setExtractionSucceeded(true);
    }
  }, [sourceType]);

  useEffect(() => {
    const runPendingSummarization = async () => {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        await handleSummarize(saved);
      }
    };

    supabase.auth.getSession().then((res) => {
      const user = res.data.session?.user;
      if (user) runPendingSummarization();
    });
  }, []);

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
              isLoading={extracting}
              setIsLoading={setExtracting}
              onManualSubmit={handleSummarize}
            />

            <ConfirmDialog
              open={confirmDialogOpen}
              onOpenChange={setConfirmDialogOpen}
              onConfirm={handleConfirmInit}
            />
          </div>
        </motion.section>

        {(rawText || sourceType === SourceType.MANUAL) && (
          <motion.section
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
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
      <LoginRequiredDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
      />
    </TooltipProvider>
  );
}
