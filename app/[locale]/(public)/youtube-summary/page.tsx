import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type FaqItem = { question: string; answer: string };
type CardItem = { title: string; body: string };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "YoutubeSummaryPage" });
  const pageUrl = `https://www.brify.app/${locale}/youtube-summary`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t.raw("keywords") as string[],
    alternates: {
      canonical: pageUrl,
      languages: {
        ko: "https://www.brify.app/ko/youtube-summary",
        en: "https://www.brify.app/en/youtube-summary",
        fr: "https://www.brify.app/fr/youtube-summary",
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

export default async function YoutubeSummaryPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "YoutubeSummaryPage" });
  const faqs = t.raw("faqs") as FaqItem[];
  const cards = t.raw("cards") as CardItem[];
  const section1Body = t.raw("section1Body") as string[];
  const bullets = t.raw("bullets") as string[];
  const pageUrl = `https://www.brify.app/${locale}/youtube-summary`;

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Brify",
        item: `https://www.brify.app/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("breadcrumbName"),
        item: pageUrl,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] text-slate-950 dark:bg-[#020617] dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />

      <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
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
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={t("demoHref")}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {t("primaryCta")}
            </Link>
            <Link
              href={t("signupHref")}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {t("secondaryCta")}
            </Link>
          </div>
        </section>

        <section className="mt-14 rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none md:p-10">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
            {t("section1Title")}
          </h2>
          <div className="mt-5 space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            {section1Body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
              {t("section2Title")}
            </h2>
            <ul className="mt-5 space-y-4">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base leading-7 text-slate-600 dark:text-slate-300">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
              {t("section3Title")}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/40"
                >
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-10 rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
            {t("faqTitle")}
          </h2>
          <div className="mt-5 space-y-5">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/40">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
