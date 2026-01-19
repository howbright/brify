type Props = {
    title: string;
    message: string;
    bullets: string[];
  };
  
  export default function ProcessingStatusCard({ title, message, bullets }: Props) {
    return (
      <section
        className="
          rounded-3xl border border-blue-200 bg-blue-50
          shadow-[0_18px_40px_-24px_rgba(37,99,235,0.45)]
          backdrop-blur-sm
          dark:bg-[#020818]/98 dark:border-[rgb(var(--hero-b))]/50
          p-4 md:p-5 flex items-start gap-3
        "
      >
        <div className="mt-0.5 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-900 text-white text-xs font-semibold dark:bg-white dark:text-neutral-900">
          AI
        </div>
  
        <div className="flex-1 space-y-2">
          <p className="text-sm md:text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
            {title}
          </p>
          <div className="rounded-2xl bg-white/95 px-3 py-2.5 text-xs md:text-sm text-neutral-700 dark:bg-black/40 dark:text-neutral-200">
            <p className="mb-1 flex items-center gap-1">
              <span>{message}</span>
              <span className="inline-flex gap-0.5">
                <span className="animate-pulse">.</span>
                <span className="animate-pulse delay-150">.</span>
                <span className="animate-pulse delay-300">.</span>
              </span>
            </p>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] md:text-xs text-neutral-500 dark:text-neutral-400">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }
  