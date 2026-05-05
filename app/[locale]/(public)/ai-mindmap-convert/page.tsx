import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAiMindMapConvertContent } from "./content";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const content = getAiMindMapConvertContent(locale);
  const pageUrl = `https://www.brify.app/${locale}/ai-mindmap-convert`;

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    keywords: content.metaKeywords,
    alternates: {
      canonical: pageUrl,
      languages: {
        ko: "https://www.brify.app/ko/ai-mindmap-convert",
        en: "https://www.brify.app/en/ai-mindmap-convert",
        fr: "https://www.brify.app/fr/ai-mindmap-convert",
        "x-default": "https://www.brify.app/en/ai-mindmap-convert",
      },
    },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url: pageUrl,
      siteName: "Brify",
      type: "website",
      images: [
        {
          url: "https://www.brify.app/images/sns_ko.png",
          width: 1200,
          height: 630,
          alt: content.ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.metaTitle,
      description: content.metaDescription,
      images: ["https://www.brify.app/images/sns_ko.png"],
    },
  };
}

export default async function AiMindMapConvertPage({ params }: PageProps) {
  const { locale } = await params;
  const content = getAiMindMapConvertContent(locale);
  const pageUrl = `https://www.brify.app/${locale}/ai-mindmap-convert`;
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
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
        name: content.breadcrumbName,
        item: pageUrl,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
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
            {content.heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            {content.heroLead}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`/${locale}/signup?next=%2Fvideo-to-map`}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.40)] transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_14px_40px_rgba(79,70,229,0.60)] active:scale-100"
            >
              {content.heroPrimaryCta}
            </Link>
            <Link
              href={locale === "en" || locale === "fr"
                ? "/share/3a805093-2bcf-484c-8a2d-e9d4f676d88e"
                : "/share/0eb4b0cd-ef56-4078-ba9d-f37cbdc43aad"}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {content.heroSecondaryCta}
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <Image
              src="/images/example.png"
              alt={content.imageAlt}
              width={1600}
              height={900}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </section>

        <section className="mt-14 rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none md:p-10">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
            {content.sectionFastTitle}
          </h2>
          <div className="mt-5 space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            {content.sectionFastParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <article className="relative overflow-hidden rounded-[30px] border border-slate-200/90 bg-[linear-gradient(140deg,#f8fbff_0%,#eef4ff_45%,#f6f3ff_100%)] p-7 shadow-[0_26px_70px_rgba(15,23,42,0.10)] dark:border-white/15 dark:bg-[linear-gradient(145deg,rgba(37,99,235,0.12)_0%,rgba(99,102,241,0.12)_52%,rgba(14,165,233,0.08)_100%)] dark:shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)]">
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-blue-300/20 blur-2xl dark:bg-blue-300/20" />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-indigo-300/20 blur-2xl dark:bg-indigo-300/20" />
            <h2 className="relative text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
              {content.sectionPracticalTitle}
            </h2>
            <p className="relative mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {content.sectionPracticalLead}
            </p>
            <div className="relative mt-6 grid gap-4 sm:grid-cols-2">
              {content.practicalItems.map((item) => (
                <div
                  key={item}
                  className="group rounded-2xl border border-white/80 bg-white/80 p-5 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-[0_14px_30px_-18px_rgba(37,99,235,0.5)] dark:border-white/15 dark:bg-white/[0.07] dark:hover:border-blue-300/40 dark:hover:bg-white/[0.10]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm dark:bg-[rgb(var(--hero-b))] dark:text-white">
                      ✓
                    </span>
                    <p className="text-sm leading-7 font-medium text-slate-700 dark:text-slate-200">
                      {item}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="relative mt-10 overflow-hidden rounded-[30px] border border-slate-200/90 bg-[linear-gradient(145deg,#f7faff_0%,#eef5ff_52%,#f8f6ff_100%)] p-7 shadow-[0_22px_60px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-[linear-gradient(145deg,rgba(37,99,235,0.10)_0%,rgba(99,102,241,0.10)_50%,rgba(14,165,233,0.07)_100%)] dark:shadow-[0_28px_72px_-52px_rgba(0,0,0,0.9)]">
          <div className="pointer-events-none absolute -right-8 top-6 h-32 w-32 rounded-full bg-blue-300/25 blur-2xl dark:bg-blue-300/20" />
          <div className="pointer-events-none absolute -left-8 -bottom-10 h-36 w-36 rounded-full bg-indigo-300/20 blur-2xl dark:bg-indigo-300/20" />
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
            {content.sectionUseCasesTitle}
          </h2>
          <ul className="relative mt-5 grid gap-4 sm:grid-cols-2">
            {content.useCases.map((item) => (
              <li
                key={item}
                className="group rounded-2xl border border-white/80 bg-white/80 p-5 text-base leading-7 text-slate-700 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-[0_14px_30px_-18px_rgba(37,99,235,0.45)] dark:border-white/15 dark:bg-white/[0.07] dark:text-slate-200 dark:hover:border-blue-300/35 dark:hover:bg-white/[0.10]"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white shadow-sm dark:bg-[rgb(var(--hero-a))] dark:text-white">
                    ★
                  </span>
                  <span>{item}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="relative mt-10 overflow-hidden rounded-[32px] border border-slate-700/70 bg-[linear-gradient(145deg,#0b1220_0%,#111827_58%,#0f172a_100%)] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] dark:border-white/15 dark:bg-[linear-gradient(145deg,#0a1020_0%,#111827_55%,#0f172a_100%)] md:p-10">
          <div className="pointer-events-none absolute -right-10 top-4 h-36 w-36 rounded-full bg-blue-400/20 blur-2xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-indigo-400/15 blur-2xl" />
          <h2 className="relative text-2xl font-bold tracking-[-0.03em]">
            {content.ctaTitle}
          </h2>
          <p className="relative mt-4 max-w-3xl text-base leading-8 text-slate-200">
            {content.ctaBody}
          </p>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${locale}/video-to-map`}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.40)] transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_14px_40px_rgba(79,70,229,0.60)] active:scale-100"
            >
              {content.ctaPrimary}
            </Link>
            <Link
              href={locale === "en" || locale === "fr"
                ? "/share/3a805093-2bcf-484c-8a2d-e9d4f676d88e"
                : "/share/0eb4b0cd-ef56-4078-ba9d-f37cbdc43aad"}
              className="inline-flex items-center justify-center rounded-full border border-blue-300/45 bg-blue-400/10 px-6 py-3 text-sm font-semibold text-blue-100 backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-blue-300/20"
            >
              {content.ctaSecondary}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
