"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";

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
  return (
    <div className="mt-4 border-t pt-4 border-gray-200 dark:border-white/10">
      <div className="flex flex-wrap gap-3 justify-center text-sm">
        {mode === "text" && (
          <>
            <ActionButton
              label="하이라이트"
              icon="mdi:highlighter"
              onClick={onHighlight}
            />
            <ActionButton
              label="더 간단하게 구조화"
              icon="lucide:sparkles"
              onClick={() => onRegenerate?.("short")}
            />
            <ActionButton
              label="더 자세히 구조화"
              icon="lucide:scan-line"
              onClick={() => onRegenerate?.("detailed")}
            />
            <ActionButton
              label="전문용어 정리"
              icon="material-symbols:translate"
              onClick={onExplainTerms}
            />
            <ActionButton
              label="PDF로 저장"
              icon="mdi:file-pdf-box"
              onClick={onExportPDF}
            />
            <ActionButton
              label="GPT에게 질문하기"
              icon="lucide:bot"
              onClick={onAskGPT}
            />
            <ActionButton
              label="복사하기"
              icon="mdi:content-copy"
              onClick={() => onCopy?.(text)} 
            />
          </>
        )}

        {mode === "diagram" && (
          <p className="text-gray-500 dark:text-gray-400">
            🧠 다이어그램 기능은 준비 중이에요!
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
