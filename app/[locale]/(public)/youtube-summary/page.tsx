import type { Metadata } from "next";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const PAGE_COPY = {
  ko: {
    title: "유튜브 요약, 유튜브 정리, 유튜브 마인드맵 | Brify",
    description:
      "Brify는 유튜브 대본, 웹페이지, 긴 텍스트를 마인드맵으로 정리해 복잡한 정보의 흐름과 구조를 한눈에 파악할 수 있게 도와줍니다.",
    pageUrl: "https://brify.app/ko/youtube-summary",
    heading: "유튜브 요약과 정리, 마인드맵으로 더 빠르게",
    lead:
      "긴 유튜브 내용을 끝까지 다 보지 않아도 핵심 흐름과 구조를 한눈에 파악하고 싶다면, Brify가 더 빠른 이해를 도와줍니다.",
    section1Title: "Brify가 유튜브 요약과 정리에 잘 맞는 이유",
    section1Body: [
      "유튜브에는 좋은 정보가 많지만, 영상이 길고 내용이 복잡할수록 핵심을 빠르게 정리하기가 쉽지 않습니다.",
      "Brify는 유튜브 대본을 마인드맵 형태로 정리해 중요한 흐름, 반복되는 개념, 서로 연결되는 내용을 한눈에 볼 수 있게 도와줍니다.",
      "단순한 요약만 보고 끝나는 것이 아니라, 나중에 다시 펼쳐보며 구조적으로 이해할 수 있다는 점이 Brify의 차이점입니다.",
    ],
    section2Title: "이런 분들에게 잘 맞습니다",
    bullets: [
      "긴 유튜브 영상을 빠르게 이해하고 싶은 사람",
      "유튜브 정리와 요약을 더 구조적으로 하고 싶은 사람",
      "마인드맵 형태로 복잡한 내용을 시각적으로 보고 싶은 사람",
      "웹페이지나 긴 텍스트도 함께 정리하고 싶은 사람",
    ],
    section3Title: "Brify로 할 수 있는 일",
    cards: [
      {
        title: "유튜브 요약",
        body: "긴 영상의 핵심 흐름을 더 빠르게 파악할 수 있습니다.",
      },
      {
        title: "유튜브 정리",
        body: "여러 개념과 세부정보를 마인드맵으로 정리해 다시 보기 쉽게 만듭니다.",
      },
      {
        title: "유튜브 마인드맵",
        body: "대본 내용을 시각적인 구조로 바꿔 한눈에 비교하고 이해할 수 있습니다.",
      },
      {
        title: "긴 텍스트 정리",
        body: "웹페이지와 긴 글도 같은 방식으로 구조화해 복잡한 정보를 더 쉽게 읽을 수 있습니다.",
      },
    ],
    faqTitle: "자주 묻는 질문",
    faqs: [
      {
        question: "Brify는 유튜브 요약 서비스인가요?",
        answer:
          "네. Brify는 유튜브 내용을 빠르게 이해할 수 있도록 도와주는 서비스입니다. 다만 단순 요약에 그치지 않고, 흐름과 구조를 마인드맵처럼 정리해 다시 보기 쉽게 만드는 데 더 강점이 있습니다.",
      },
      {
        question: "유튜브 정리와 마인드맵을 함께 할 수 있나요?",
        answer:
          "할 수 있습니다. Brify는 유튜브 대본을 정리하면서 동시에 마인드맵 형태로 시각화해, 복잡한 정보를 한눈에 파악할 수 있게 도와줍니다.",
      },
      {
        question: "유튜브 말고 웹페이지나 긴 글도 정리할 수 있나요?",
        answer:
          "네. Brify는 유튜브 대본뿐 아니라 웹페이지와 긴 텍스트도 함께 정리할 수 있도록 설계되어 있습니다.",
      },
    ],
    primaryCta: "데모 보기",
    secondaryCta: "Brify 시작하기",
    demoHref: "/ko/demo",
    signupHref: "/ko/signup",
  },
  en: {
    title: "YouTube Summary, YouTube Notes, and YouTube Mind Maps | Brify",
    description:
      "Brify turns YouTube transcripts, webpages, and long text into mind maps so you can understand complex information at a glance.",
    pageUrl: "https://brify.app/en/youtube-summary",
    heading: "Summarize and organize YouTube videos with mind maps",
    lead:
      "If you want to understand long YouTube content without watching every minute, Brify helps you grasp the flow and structure faster.",
    section1Title: "Why Brify works well for YouTube summaries and notes",
    section1Body: [
      "YouTube is full of useful information, but long videos and complex topics are hard to organize quickly.",
      "Brify turns YouTube transcripts into mind maps so you can see the main flow, repeated ideas, and connected details at a glance.",
      "Instead of ending with a plain summary, Brify helps you revisit and understand the structure of the content more clearly.",
    ],
    section2Title: "Who this is for",
    bullets: [
      "People who want to understand long YouTube videos faster",
      "People who want more structured YouTube notes and summaries",
      "People who prefer visual mind maps for complex information",
      "People who also want to organize webpages and long text",
    ],
    section3Title: "What you can do with Brify",
    cards: [
      {
        title: "YouTube summaries",
        body: "Understand the key flow of long videos more quickly.",
      },
      {
        title: "YouTube notes",
        body: "Organize multiple concepts and details into a mind map you can revisit later.",
      },
      {
        title: "YouTube mind maps",
        body: "Turn transcripts into a visual structure you can compare and understand at a glance.",
      },
      {
        title: "Long-text organization",
        body: "Use the same workflow for webpages and long text to make complex information easier to digest.",
      },
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      {
        question: "Is Brify a YouTube summary tool?",
        answer:
          "Yes. Brify helps you understand YouTube content faster. Its strength is not only summarizing, but also organizing flow and structure into a mind-map-like format you can revisit.",
      },
      {
        question: "Can I organize YouTube videos as mind maps?",
        answer:
          "Yes. Brify helps you organize YouTube transcripts while also visualizing them as mind maps, making complex information easier to grasp.",
      },
      {
        question: "Can Brify also organize webpages and long text?",
        answer:
          "Yes. Brify is designed to work with YouTube transcripts, webpages, and long text so you can use the same workflow across different sources.",
      },
    ],
    primaryCta: "View demo",
    secondaryCta: "Start Brify",
    demoHref: "/en/demo",
    signupHref: "/en/signup",
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const copy = locale === "en" ? PAGE_COPY.en : PAGE_COPY.ko;

  return {
    title: copy.title,
    description: copy.description,
    keywords:
      locale === "en"
        ? [
            "youtube summary",
            "youtube notes",
            "youtube mind map",
            "mind map",
            "webpage summary",
            "Brify",
          ]
        : [
            "유튜브 요약",
            "유튜브 정리",
            "유튜브 마인드맵",
            "마인드맵",
            "유튜브 대본 정리",
            "브리피",
          ],
    alternates: {
      canonical: copy.pageUrl,
      languages: {
        ko: PAGE_COPY.ko.pageUrl,
        en: PAGE_COPY.en.pageUrl,
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: copy.pageUrl,
      siteName: "Brify",
      type: "website",
      images: [
        {
          url: locale === "en"
            ? "https://brify.app/images/sns_en.png"
            : "https://brify.app/images/sns_ko.png",
          width: 1200,
          height: 630,
          alt: copy.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [
        locale === "en"
          ? "https://brify.app/images/sns_en.png"
          : "https://brify.app/images/sns_ko.png",
      ],
    },
  };
}

export default async function YoutubeSummaryPage({ params }: PageProps) {
  const { locale } = await params;
  const copy = locale === "en" ? PAGE_COPY.en : PAGE_COPY.ko;

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faqs.map((faq) => ({
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
        item: locale === "en" ? "https://brify.app/en" : "https://brify.app/ko",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "en" ? "YouTube Summary" : "유튜브 요약",
        item: copy.pageUrl,
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
            {copy.heading}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            {copy.lead}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={copy.demoHref}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {copy.primaryCta}
            </Link>
            <Link
              href={copy.signupHref}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {copy.secondaryCta}
            </Link>
          </div>
        </section>

        <section className="mt-14 rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none md:p-10">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
            {copy.section1Title}
          </h2>
          <div className="mt-5 space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            {copy.section1Body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
              {copy.section2Title}
            </h2>
            <ul className="mt-5 space-y-4">
              {copy.bullets.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base leading-7 text-slate-600 dark:text-slate-300">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
              {copy.section3Title}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {copy.cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/40"
                >
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white">
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

        <section className="mt-10 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none md:p-10">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
            {copy.faqTitle}
          </h2>
          <div className="mt-6 space-y-5">
            {copy.faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/40"
              >
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  {faq.question}
                </h3>
                <p className="mt-2 text-base leading-8 text-slate-600 dark:text-slate-300">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
