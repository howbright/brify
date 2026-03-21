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
      className="relative z-[20] w-full"
      style={{ height: "var(--header-h)" }}
    >
      <div className="flex flex-col">
        <div className="flex h-[26px] items-center justify-between bg-[#1f2937] px-3 text-[14px] font-extrabold tracking-tight text-white dark:bg-[#0b1220] sm:justify-center">
          <div className="truncate text-left sm:flex-1 sm:text-center">{title}</div>
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
        <div className="flex h-[42px] items-center justify-between gap-2 border-b border-slate-500 bg-[linear-gradient(180deg,#f4f7fb_0%,#edf3fb_100%)] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(148,163,184,0.45)] backdrop-blur dark:border-white/25 dark:bg-[linear-gradient(180deg,rgba(20,29,45,0.98)_0%,rgba(13,20,33,0.98)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(255,255,255,0.08)] sm:h-[42px]">
          <div className="min-w-0 flex items-center gap-2 flex-1">{left}</div>
          <div className="flex items-center justify-end gap-2 shrink-0">{right}</div>
        </div>
      </div>
    </header>
  );
}
