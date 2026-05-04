"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  value: string;
  onChange: (text: string) => void;
}

export default function ExtractedText({ value, onChange }: Props) {
  const t = useTranslations("SummarizePage.extractedText");
  const [copied, setCopied] = useState(false);
  const copyLabel = copied ? t("copied") : t("copy");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("복사 실패:", error);
    }
  };

  return (
    <div className="relative  bg-primary/5 dark:bg-[#18181c]  flex flex-col gap-2 p-6 rounded-2xl border">
      {/* 복사 버튼 */}
      <div className="absolute top-3 right-5">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copyLabel}
        </button>
      </div>

      <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">
        {t("sourceLabel")}
      </label>
      <textarea
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 dark:border-white/20 p-4 rounded-lg bg-white dark:bg-black text-sm text-gray-800 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-primary"
        placeholder={t("placeholder")}
      />

      {/* 안내 문구 */}
      <div className="flex justify-end">
        <p className="text-xs text-gray-400">
          {t("hint")}
        </p>
      </div>
    </div>
  );
}
