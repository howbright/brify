"use client";

import type { RefObject } from "react";

type Props = {
  show: boolean;
  label: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export default function MindElixirMiniMap({
  show,
  label,
  canvasRef,
}: Props) {
  if (!show) return null;

  return (
    <div className="pointer-events-auto absolute bottom-6 right-4 z-20 rounded-xl border border-neutral-200 bg-white/90 p-2 shadow-sm dark:border-white/45 dark:bg-[#0b1220]/82 dark:shadow-[0_16px_42px_-24px_rgba(15,23,42,0.92)]">
      <div className="text-[14px] font-bold text-neutral-600 dark:text-white/88">
        {label}
      </div>
      <canvas ref={canvasRef} className="mt-1 h-[132px] w-[176px]" />
    </div>
  );
}
