import type { Metadata } from "next";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const PAGE_COPY = {
  ko: {
    title: "마인드맵으로 복잡한 정보 정리 | Brify",
    description:
      "Brify는 유튜브 대본, 웹페이지, 긴 텍스트를 마인드맵으로 정리해 흐름과 구조를 한눈에 파악할 수 있게 도와줍니다.",
    pageUrl: "https://brify.app/ko/mind-map",
    heading: "마인드맵으로 복잡한 정보를 더 쉽게 이해하세요",
    lead:
      "마인드맵은 많은 정보를 한눈에 정리하고 다시 펼쳐보기 좋은 방식입니다. Brify는 유튜브와 긴 텍스트를 이 흐름에 맞게 정리해줍니다.",
    paragraphs: [
      "마인드맵은 단순히 예쁘게 정리하는 도구가 아니라, 복잡한 정보의 관계와 흐름을 더 선명하게 이해하도록 도와주는 방식입니다.",
      "Brify는 유튜브 대본, 웹페이지, 긴 텍스트를 마인드맵으로 바꿔 주요 개념과 연결 관계를 한눈에 보이게 만듭니다.",
      "그래서 공부, 리서치, 정보 비교, 긴 콘텐츠 정리처럼 복잡한 입력을 다루는 상황에서 특히 더 잘 맞습니다.",
    ],
    bullets: [
      "유튜브를 마인드맵으로 정리하고 싶은 사람",
      "긴 글을 한눈에 보고 싶은 사람",
      "흐름과 구조를 시각적으로 이해하고 싶은 사람",
      "여러 내용을 비교하며 차이를 보고 싶은 사람",
    ],
    ctaTitle: "Brify로 시작하는 마인드맵 정리",
    ctaBody:
      "유튜브, 웹페이지, 긴 텍스트를 마인드맵으로 정리해 복잡한 정보를 더 빠르게 이해해보세요.",
    primaryCta: "Brify 시작하기",
    secondaryCta: "유튜브 정리 페이지 보기",
    signupHref: "/ko/signup",
    relatedHref: "/ko/youtube-notes",
  },
  en: {
    title: "Mind Maps for Complex Information | Brify",
    description:
      "Brify turns YouTube transcripts, webpages, and long text into mind maps so you can understand flow and structure at a glance.",
    pageUrl: "https://brify.app/en/mind-map",
    heading: "Use mind maps to understand complex information faster",
    lead:
      "Mind maps are a powerful way to organize a lot of information and revisit it later. Brify applies that workflow to YouTube and long-form text.",
    paragraphs: [
      "A mind map is not only a neat format. It is a way to understand relationships, hierarchy, and flow inside complex information.",
      "Brify turns YouTube transcripts, webpages, and long text into mind maps so key ideas and their connections become easier to see.",
      "That makes Brify especially useful for study, research, comparison, and any workflow that deals with complex inputs.",
    ],
    bullets: [
      "People who want mind maps from YouTube content",
      "People who want long text at a glance",
      "People who want visual flow and structure",
      "People who compare multiple sources and ideas",
    ],
    ctaTitle: "Start organizing with Brify mind maps",
    ctaBody:
      "Turn YouTube, webpages, and long text into mind maps and understand complex information faster.",
    primaryCta: "Start Brify",
    secondaryCta: "See YouTube notes page",
    signupHref: "/en/signup",
    relatedHref: "/en/youtube-notes",
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
        ? ["mind map", "youtube mind map", "text mind map", "Brify"]
        : ["마인드맵", "유튜브 마인드맵", "텍스트 마인드맵", "정보 정리", "브리피"],
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
          url:
            locale === "en"
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

export default async function MindMapPage({ params }: PageProps) {
  const { locale } = await params;
  const copy = locale === "en" ? PAGE_COPY.en : PAGE_COPY.ko;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] text-slate-950 dark:bg-[#020617] dark:text-white">
      <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-20">
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
        </section>

        <section className="mt-12 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none md:p-10">
          <div className="space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none md:p-10">
          <ul className="grid gap-4 sm:grid-cols-2">
            {copy.bullets.map((item) => (
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
            {copy.ctaTitle}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200 dark:text-slate-300">
            {copy.ctaBody}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={copy.signupHref}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
            >
              {copy.primaryCta}
            </Link>
            <Link
              href={copy.relatedHref}
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {copy.secondaryCta}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
