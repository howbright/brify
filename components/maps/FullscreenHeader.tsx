import { type ReactNode } from "react";
type Props = {
  title: string;
  onClose: () => void;
  closeLabel: string;
  left?: ReactNode;
  right?: ReactNode;
};

export default function FullscreenHeader({
  title,
  onClose,
  closeLabel,
  left,
  right,
}: Props) {
  return (
    <header
      className="relative z-[20] w-full border-b border-slate-400 dark:border-white/20"
      style={{ height: "var(--header-h)" }}
    >
      <div className="flex flex-col">
        <div className="h-[28px] px-3 flex items-center justify-between bg-[#1f2937] text-white text-[11px] font-semibold tracking-tight dark:bg-[#0b1220] sm:justify-center">
          <div className="truncate text-left sm:text-center sm:flex-1">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="
              inline-flex h-7 w-7 items-center justify-center
              rounded-md border border-white/70
              text-white/90 hover:text-white hover:border-white
            "
            aria-label={closeLabel}
            title={closeLabel}
          >
            <span className="sr-only">{closeLabel}</span>
            <span className="text-[16px] leading-none">×</span>
          </button>
        </div>
        <div className="h-[40px] px-3 flex items-center justify-between gap-2 bg-white backdrop-blur dark:bg-[#0b1220] sm:h-[40px]">
          <div className="min-w-0 flex items-center gap-2 flex-1">{left}</div>
          <div className="flex items-center justify-end gap-2 shrink-0">{right}</div>
        </div>
      </div>
    </header>
  );
}
