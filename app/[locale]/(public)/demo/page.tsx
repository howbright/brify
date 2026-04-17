import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import { getTranslations } from "next-intl/server";
import LanguageSelector from "@/components/LanguageSelector";
import { getSharedMapMetaByToken } from "@/app/lib/sharedMapMeta";

const DEMO_SHARE_TOKEN = "fca4a9b3-cd00-4230-8313-489246c3d634";

type DemoPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

function sourceTypeLabel(
  sourceType: string | null,
  t: Awaited<ReturnType<typeof getTranslations<"DemoPage">>>
) {
  if (sourceType === "youtube") return t("meta.sourceTypes.youtube");
  if (sourceType === "website") return t("meta.sourceTypes.website");
  if (sourceType === "file") return t("meta.sourceTypes.file");
  return t("meta.sourceTypes.manual");
}

export default async function DemoPage({ params }: DemoPageProps) {
  const { locale } = await params;
  const t = await getTranslations("DemoPage");
  const demo = await getSharedMapMetaByToken(DEMO_SHARE_TOKEN);
  const shareHref = `/${locale}/share/${DEMO_SHARE_TOKEN}`;

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950 dark:bg-[#020617] dark:text-white">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:px-10 lg:px-12">
        <div className="flex justify-end">
          <LanguageSelector compact />
        </div>

        <section className="mx-auto mt-8 max-w-4xl text-center">
          <p className="text-sm font-semibold tracking-[0.18em] text-blue-700 dark:text-blue-300">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl md:text-4xl dark:text-white">
            {t("title")}
          </h1>
        </section>

        <section className="mx-auto mt-8 max-w-5xl">
          <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-7 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:px-8 sm:py-9 lg:px-10 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <p className="text-sm font-bold tracking-[-0.02em] text-blue-700 sm:text-base dark:text-blue-300">
              {t("intro.eyebrow")}
            </p>
            <div className="mt-5 max-w-4xl space-y-5">
              <p className="text-lg font-semibold leading-8 text-slate-700 sm:text-xl dark:text-slate-200">
                {t("intro.intro")}
              </p>
              <div className="space-y-4">
                <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
                  {t("intro.speaker")}
                </p>
              </div>
              <p className="text-lg font-semibold leading-8 text-slate-900 sm:text-[22px] dark:text-white">
                {t("intro.lead")}
              </p>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
                {t("intro.body1")}
              </p>
              <p className="text-base font-semibold leading-8 text-slate-900 dark:text-white">
                {t("intro.body2")}
              </p>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
                {t("intro.body3")}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] xl:gap-8">
          <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
              {demo?.thumbnailUrl ? (
                <Image
                  src={demo.thumbnailUrl}
                  alt={demo.youtubeTitle || demo.title || "YouTube thumbnail"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 380px"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#dbeafe,#f8fafc)] text-sm font-medium text-slate-500 dark:bg-[linear-gradient(135deg,#0f172a,#111827)] dark:text-slate-400">
                  {t("meta.thumbnailFallback")}
                </div>
              )}
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <Icon icon="mdi:youtube" className="h-4 w-4 text-red-500" />
                {t("meta.youtubeExample")}
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {t("meta.titleLabel")}
                </p>
                <h2 className="mt-2 text-xl font-bold leading-8 text-slate-950 dark:text-white">
                  {demo?.title || t("meta.untitledFallback")}
                </h2>
              </div>

              <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.04]">
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {t("meta.sourceTypeLabel")}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {sourceTypeLabel(demo?.sourceType ?? null, t)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {t("meta.channelLabel")}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {demo?.channelName || t("meta.channelFallback")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {t("meta.youtubeTitleLabel")}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {demo?.youtubeTitle || demo?.title || t("meta.youtubeTitleFallback")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {t("meta.summaryLabel")}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {demo?.summary || demo?.description || t("meta.summaryFallback")}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {t("meta.tagsLabel")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(demo?.tags ?? []).length > 0 ? (
                    demo?.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {t("meta.tagsFallback")}
                    </span>
                  )}
                </div>
              </div>

              {demo?.sourceUrl ? (
                <Link
                  href={demo.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  {t("meta.originalLink")}
                  <Icon icon="mdi:open-in-new" className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </article>

          <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#07111f] dark:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {t("preview.eyebrow")}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                  {t("preview.title")}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("preview.helper")}
                </p>
              </div>
              <Link
                href={shareHref}
                className="inline-flex min-w-[148px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {t("preview.cta")}
                <Icon icon="mdi:arrow-top-right" className="h-4 w-4" />
              </Link>
            </div>

            <div className="p-4 sm:p-5">
              <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950">
                <div className="relative h-[720px] overflow-hidden">
                  <iframe
                    src={shareHref}
                    title="Demo shared map preview"
                    className="pointer-events-none absolute left-0 top-0 h-[160%] w-[160%] origin-top-left scale-[0.625] border-0"
                  />
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
