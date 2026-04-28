import type { Metadata } from "next";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const PAGE_COPY = {
  ko: {
    title: "유튜브 정리, 유튜브 내용 정리 | Brify",
    description:
      "Brify는 긴 유튜브 대본을 마인드맵으로 정리해 복잡한 내용의 흐름과 구조를 더 빠르게 이해할 수 있게 도와줍니다.",
    pageUrl: "https://www.brify.app/ko/youtube-notes",
    heading: "긴 유튜브 내용을 더 쉽게 정리하는 방법",
    lead:
      "좋은 정보가 있는 유튜브를 저장만 해두고 끝내기 쉬웠다면, Brify로 핵심 흐름과 구조를 다시 펼쳐보기 쉬운 형태로 정리해보세요.",
    body: [
      "유튜브 정리가 어려운 이유는 단순히 영상이 길어서만이 아닙니다. 비슷한 말이 반복되고, 중요한 개념이 여러 구간에 흩어져 있어서 나중에 다시 꺼내볼 때 더 복잡하게 느껴지기 때문입니다.",
      "Brify는 유튜브 대본을 마인드맵 형태로 정리해, 어떤 내용이 중심이고 무엇이 연결되는지 한눈에 볼 수 있게 도와줍니다.",
      "그래서 유튜브 요약만 보는 것보다, 정리된 흐름과 구조를 다시 보며 이해하고 싶은 분들에게 더 잘 맞습니다.",
    ],
    bullets: [
      "긴 유튜브 영상을 저장만 하고 나중에 못 보는 사람",
      "영상 내용을 메모처럼 정리하고 싶은 사람",
      "요약보다 흐름과 연결 관계까지 보고 싶은 사람",
      "한 번 본 유튜브 내용을 다시 펼쳐보고 싶은 사람",
    ],
    ctaTitle: "유튜브 정리를 더 구조적으로 하고 싶다면",
    ctaBody:
      "Brify는 유튜브 대본을 마인드맵으로 정리해, 복잡한 정보를 더 빠르게 이해하고 다시 보기 쉽게 도와줍니다.",
    primaryCta: "데모 보기",
    secondaryCta: "유튜브 요약 페이지 보기",
    demoHref: "/ko/demo",
    relatedHref: "/ko/youtube-summary",
  },
  en: {
    title: "YouTube Notes and YouTube Video Organization | Brify",
    description:
      "Brify helps you organize YouTube videos into structured notes and mind maps so you can revisit long content more easily.",
    pageUrl: "https://www.brify.app/en/youtube-notes",
    heading: "A better way to organize YouTube videos and notes",
    lead:
      "If you keep saving useful YouTube videos but rarely revisit them, Brify helps you organize YouTube notes, flow, and structure into something easier to review later.",
    body: [
      "Organizing YouTube content is hard not only because videos are long, but also because important ideas are repeated and scattered across different sections.",
      "Brify helps you turn YouTube transcripts into structured notes and mind maps, so you can see what is central and how ideas connect at a glance.",
      "That makes Brify a better fit for people who want more than a short summary and want to revisit the structure of the content later.",
    ],
    bullets: [
      "People who save long YouTube videos but rarely revisit them",
      "People who want YouTube notes in a clearer structure",
      "People who want more than summaries and need flow and connections",
      "People who want to reopen and review what they watched",
    ],
    ctaTitle: "If you want more structured YouTube notes",
    ctaBody:
      "Brify turns YouTube transcripts into mind maps so you can understand complex information faster and revisit it more easily.",
    primaryCta: "View demo",
    secondaryCta: "See YouTube summary page",
    demoHref: "/en/demo",
    relatedHref: "/en/youtube-summary",
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
        ? ["youtube notes", "youtube organization", "organize youtube videos", "youtube mind map", "Brify"]
        : ["유튜브 정리", "유튜브 내용 정리", "유튜브 메모", "유튜브 마인드맵", "브리피"],
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
              ? "https://www.brify.app/images/sns_en.png"
              : "https://www.brify.app/images/sns_ko.png",
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
          ? "https://www.brify.app/images/sns_en.png"
          : "https://www.brify.app/images/sns_ko.png",
      ],
    },
  };
}

export default async function YoutubeNotesPage({ params }: PageProps) {
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
            {copy.body.map((paragraph) => (
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
              href={copy.demoHref}
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
