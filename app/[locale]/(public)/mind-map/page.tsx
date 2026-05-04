import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MindMapPage" });
  const pageUrl = `https://www.brify.app/${locale}/mind-map`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t.raw("keywords") as string[],
    alternates: {
      canonical: pageUrl,
      languages: {
        ko: "https://www.brify.app/ko/mind-map",
        en: "https://www.brify.app/en/mind-map",
        fr: "https://www.brify.app/fr/mind-map",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: pageUrl,
      siteName: "Brify",
      type: "website",
      images: [
        {
          url: t("ogImage"),
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [t("ogImage")],
    },
  };
}

export default async function MindMapPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MindMapPage" });
  const paragraphs = t.raw("paragraphs") as string[];
  const bullets = t.raw("bullets") as string[];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] text-slate-950 dark:bg-[#020617] dark:text-white">
      <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-20">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold tracking-[0.18em] text-blue-700 dark:text-blue-300">
            Brify
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl dark:text-white">
            {t("heading")}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            {t("lead")}
          </p>
        </section>

        <section className="mt-12 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none md:p-10">
          <div className="space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none md:p-10">
          <ul className="grid gap-4 sm:grid-cols-2">
            {bullets.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-base leading-7 text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-white/[0.06] md:p-10">
          <h2 className="text-2xl font-bold tracking-[-0.03em]">
            {t("ctaTitle")}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200 dark:text-slate-300">
            {t("ctaBody")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={t("signupHref")}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
            >
              {t("primaryCta")}
            </Link>
            <Link
              href={t("relatedHref")}
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t("secondaryCta")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
