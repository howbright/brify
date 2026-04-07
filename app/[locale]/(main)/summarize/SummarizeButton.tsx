"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";

interface Props {
  onSummarize: () => void;
  loading: boolean;
  disabled?: boolean;
}

export default function SummarizeButton({ onSummarize, loading, disabled }: Props) {
  const isDisabled = loading || disabled;

  return (
    <div className="flex justify-center">
      <button
        onClick={onSummarize}
        disabled={isDisabled}
        className={clsx(
          "group flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg text-white bg-primary transition-all duration-200",
          "hover:bg-primary-dark hover:shadow-md",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {loading ? (
          <>
            <Icon icon="lucide:loader" className="animate-spin" width={18} />
            구조화 중...
          </>
        ) : (
          <>
            <span>핵심정리하기</span>
            <Icon
              icon="lucide:sparkles"
              width={18}
              className="transition-transform group-hover:-translate-y-0.5"
            />
          </>
        )}
      </button>
    </div>
  );
}
