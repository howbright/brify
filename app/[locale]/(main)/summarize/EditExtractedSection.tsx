"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import SummarizeButton from "./SummarizeButton";

interface Props {
  isManual: boolean;
  rawText: string;
  setRawText: (v: string) => void;
  loading: boolean;
  hasSummarized: boolean;
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
  extractionSucceeded,
  onSummarize,
}: Props) {
  const t = useTranslations("SummarizePage.editor");
  const [copied, setCopied] = useState(false);
  const isTooShort = rawText.trim().length < 300;
  const copyLabel = copied ? t("copied") : t("copy");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("복사 실패:", error);
    }
  };

  return (
    <section className="bg-white mt-5 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-10 shadow-md flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 text-center">
        {isManual ? (
          <>
            {t("manualTitle")}
            <br className="hidden sm:block" />
            {t("manualSubtitle")}
          </>
        ) : (
          <>
            {t("readyTitle")}
            <br className="hidden sm:block" />
            {t("readySubtitle")}
          </>
        )}
      </h3>

      <div className="relative flex flex-col mb-5 gap-2 p-6 rounded-2xl border border-gray-200 dark:border-white/20 bg-primary/5 dark:bg-[#18181c]">
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copyLabel}
        </button>

        <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">
          {t("sourceLabel")}
        </label>
        <textarea
          rows={10}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="w-full border border-gray-300 dark:border-white/20 p-4 rounded-lg bg-white dark:bg-black text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={
            isManual
              ? t("manualPlaceholder")
              : t("extractedPlaceholder")
          }
        />

        <p className="text-xs text-gray-400 text-right mt-2">
          {t("retentionHint")}
        </p>
        {isTooShort && (
          <p className="text-xs text-red-500 text-right">
            {t("minLengthHint")}
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
              {t("loadingTitle")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("loadingDescription")}
              <br /> {t("loadingDuration")}
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
      ) : (
        <SummarizeButton
          disabled={hasSummarized || isTooShort || !extractionSucceeded}
          onSummarize={() => onSummarize(rawText)}
          loading={false}
        />
      )}
    </section>
  );
}
