"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

export interface SummaryActionsProps {
  mode: "text" | "diagram";
  text: string; // ✅ text prop 추가
  onHighlight?: () => void;
  onRegenerate?: (level: "short" | "detailed") => void;
  onExplainTerms?: () => void;
  onExportPDF?: () => void;
  onAskGPT?: () => void;
  onCopy?: (text: string) => void; // ✅ 콜백에 text 넘기기
}

export default function SummaryActions({
  mode,
  onRegenerate,
  onExportPDF,
  onExplainTerms,
  onAskGPT,
  onHighlight,
  onCopy,
  text
}: SummaryActionsProps) {
  const t = useTranslations("SummarizePage.actions");

  return (
    <div className="mt-4 border-t pt-4 border-gray-200 dark:border-white/10">
      <div className="flex flex-wrap gap-3 justify-center text-sm">
        {mode === "text" && (
          <>
            <ActionButton
              label={t("highlight")}
              icon="mdi:highlighter"
              onClick={onHighlight}
            />
            <ActionButton
              label={t("shorter")}
              icon="lucide:sparkles"
              onClick={() => onRegenerate?.("short")}
            />
            <ActionButton
              label={t("detailed")}
              icon="lucide:scan-line"
              onClick={() => onRegenerate?.("detailed")}
            />
            <ActionButton
              label={t("terms")}
              icon="material-symbols:translate"
              onClick={onExplainTerms}
            />
            <ActionButton
              label={t("exportPdf")}
              icon="mdi:file-pdf-box"
              onClick={onExportPDF}
            />
            <ActionButton
              label={t("askGpt")}
              icon="lucide:bot"
              onClick={onAskGPT}
            />
            <ActionButton
              label={t("copy")}
              icon="mdi:content-copy"
              onClick={() => onCopy?.(text)} 
            />
          </>
        )}

        {mode === "diagram" && (
          <p className="text-gray-500 dark:text-gray-400">
            {t("diagramSoon")}
          </p>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-4 py-2 border rounded-full font-medium",
        "text-gray-700 dark:text-white border-gray-300 dark:border-white/20",
        "hover:bg-gray-100 dark:hover:bg-white/10 transition"
      )}
    >
      <Icon icon={icon} width={18} />
      <span>{label}</span>
    </button>
  );
}
