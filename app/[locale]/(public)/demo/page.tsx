import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import { getTranslations } from "next-intl/server";
import LanguageSelector from "@/components/LanguageSelector";
import { getSharedMapMetaByToken } from "@/app/lib/sharedMapMeta";

const DEMO_SHARE_TOKENS = {
  ko: "0eb4b0cd-ef56-4078-ba9d-f37cbdc43aad",
  en: "3a805093-2bcf-484c-8a2d-e9d4f676d88e",
} as const;

type DemoPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function DemoPage({ params }: DemoPageProps) {
  const { locale } = await params;
  const t = await getTranslations("DemoPage");
  const demoShareToken =
    locale === "ko" ? DEMO_SHARE_TOKENS.ko : DEMO_SHARE_TOKENS.en;
  const demo = await getSharedMapMetaByToken(demoShareToken);
  const shareHref = `/${locale}/share/${demoShareToken}`;
  const videoTitle = demo?.youtubeTitle || demo?.title || t("meta.youtubeTitleFallback");

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

        <section className="mt-10 grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)] xl:grid-cols-[460px_minmax(0,1fr)] xl:gap-8">
          <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
              {demo?.thumbnailUrl ? (
                <Image
                  src={demo.thumbnailUrl}
                  alt={videoTitle || "YouTube thumbnail"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 460px"
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

            <div className="space-y-3 p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                {t("meta.youtubeTitleLabel")}
              </p>
              <h2 className="text-xl font-bold leading-8 text-slate-950 sm:text-2xl dark:text-white">
                {videoTitle}
              </h2>
            </div>
          </article>

          <article className="rounded-[32px] border border-slate-200 bg-white px-6 py-7 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:px-8 sm:py-9 lg:px-10 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <p className="text-sm font-bold tracking-[-0.02em] text-blue-700 sm:text-base dark:text-blue-300">
              {t("intro.eyebrow")}
            </p>
            <div className="mt-5 max-w-4xl space-y-5">
              <p className="text-lg font-semibold leading-8 text-slate-700 sm:text-xl dark:text-slate-200">
                {t("intro.intro")}
              </p>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
                {t("intro.speaker")}
              </p>
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
          </article>
        </section>

        <section className="mt-10">
          <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#07111f] dark:shadow-none">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {t("preview.eyebrow")}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
                  {t("preview.title")}
                </h2>
              </div>
              <Link
                href={shareHref}
                className="inline-flex min-w-[148px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {t("preview.cta")}
                <Icon icon="mdi:arrow-top-right" className="h-4 w-4" />
              </Link>
            </div>

            <div className="p-4 sm:p-5 lg:p-6">
              <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950">
                <Link
                  href={shareHref}
                  aria-label={t("preview.cta")}
                  className="absolute inset-0 z-10"
                >
                  <span className="sr-only">{t("preview.cta")}</span>
                </Link>
                <div className="relative h-[520px] overflow-hidden sm:h-[760px] lg:h-[1100px] xl:h-[1220px]">
                  <iframe
                    src={shareHref}
                    title={t("preview.imageAlt")}
                    className="pointer-events-none absolute left-0 top-0 h-[150%] w-[150%] origin-top-left scale-[0.6667] border-0 lg:h-[140%] lg:w-[140%] lg:scale-[0.7143]"
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
