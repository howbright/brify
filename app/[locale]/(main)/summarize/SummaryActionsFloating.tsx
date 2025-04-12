"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import SummaryActions from "./SummaryActions";

interface Props {
  mode: "text" | "diagram";
  text?: string;
  onHighlight: () => void;
  onRegenerate: (level: "short" | "detailed") => void;
  onExplainTerms: () => void;
  onExportPDF: () => void;
  onAskGPT: () => void;
  onCopy: (text: string) => void;
  targetId?: string;
}

export default function SummaryActionsFloating({
  mode,
  text,
  onHighlight,
  onRegenerate,
  onExplainTerms,
  onExportPDF,
  onAskGPT,
  onCopy,
  targetId = "textView",
}: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const target = document.getElementById(targetId);
      if (!target) return;

      const top = target.getBoundingClientRect().top;

      // top이 -100 이하 (즉 100px 이상 스크롤 내린 상태)
      if (top < -100) {
        setShow(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [targetId]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={clsx(
          "flex flex-wrap gap-3 bg-white dark:bg-[#1c1c1c] shadow-xl border border-gray-200 dark:border-white/10 rounded-xl p-4",
          "transition-all duration-300"
        )}
      >
        {mode === "text" && (
         <SummaryActions mode={"text"} text={""}/>
        )}
        {/* 다이어그램 모드 추가 예정 */}
      </div>
    </div>
  );
}
