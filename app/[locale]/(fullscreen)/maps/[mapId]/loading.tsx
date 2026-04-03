export default function MapDetailLoading() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 pb-6 pt-4 dark:bg-[#020817]">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white/90 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#0b1220]/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-2xl bg-neutral-200 dark:bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded-full bg-neutral-200 dark:bg-white/10" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-neutral-100 dark:bg-white/5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 animate-pulse rounded-2xl bg-neutral-200 dark:bg-white/10" />
            <div className="h-9 w-9 animate-pulse rounded-2xl bg-neutral-200 dark:bg-white/10" />
            <div className="h-9 w-9 animate-pulse rounded-2xl bg-neutral-200 dark:bg-white/10" />
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-120px)] grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="hidden rounded-3xl border border-neutral-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-[#0b1220]/75 lg:block">
            <div className="space-y-3">
              <div className="h-5 w-32 animate-pulse rounded-full bg-neutral-200 dark:bg-white/10" />
              <div className="h-20 animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/5" />
              <div className="h-20 animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/5" />
              <div className="h-20 animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/5" />
            </div>
          </aside>

          <section className="rounded-[28px] border border-neutral-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-[#0b1220]/75">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="h-5 w-52 animate-pulse rounded-full bg-neutral-200 dark:bg-white/10" />
                <div className="h-3 w-28 animate-pulse rounded-full bg-neutral-100 dark:bg-white/5" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 animate-pulse rounded-2xl bg-neutral-200 dark:bg-white/10" />
                <div className="h-8 w-8 animate-pulse rounded-2xl bg-neutral-200 dark:bg-white/10" />
              </div>
            </div>

            <div className="relative min-h-[60vh] overflow-hidden rounded-[26px] border border-dashed border-neutral-300 bg-gradient-to-br from-neutral-50 via-white to-sky-50 dark:border-white/10 dark:from-[#08111f] dark:via-[#0b1220] dark:to-[#0b1a2f]">
              <div className="absolute left-[8%] top-[12%] h-16 w-40 animate-pulse rounded-3xl bg-white/80 shadow-sm dark:bg-white/10" />
              <div className="absolute right-[16%] top-[24%] h-14 w-36 animate-pulse rounded-3xl bg-white/75 shadow-sm dark:bg-white/10" />
              <div className="absolute left-[24%] top-[44%] h-16 w-44 animate-pulse rounded-3xl bg-white/80 shadow-sm dark:bg-white/10" />
              <div className="absolute right-[10%] top-[58%] h-14 w-32 animate-pulse rounded-3xl bg-white/75 shadow-sm dark:bg-white/10" />
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm dark:border-sky-400/20 dark:bg-[#081120]/90 dark:text-sky-200">
                <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-sky-500" />
                구조맵을 여는 중...
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
