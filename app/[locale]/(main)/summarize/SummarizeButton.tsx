"use client";

import clsx from "clsx";

interface Props {
  onSummarize: () => void;
  loading: boolean;
  disabled?: boolean;
}

export default function SummarizeButton({ onSummarize, loading, disabled }: Props) {
  return (
    <div className="text-center mt-6">
      <button
        onClick={onSummarize}
        disabled={loading || disabled}
        className={clsx(
          "px-6 py-3 rounded-lg text-white font-semibold text-base transition",
          loading || disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-primary hover:bg-primary-dark"
        )}
      >
        {loading ? "요약 중입니다..." : "✨ 핵심정리하기"}
      </button>
    </div>
  );
}
