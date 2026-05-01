import type { Metadata } from "next";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const PAGE_COPY = {
  ko: {
    title: "브라이피(Brify) | 마인드맵으로 복잡한 정보 정리",
    description:
      "브라이피(Brify)는 유튜브 대본, 웹페이지, 긴 텍스트를 마인드맵으로 정리해 흐름과 구조를 한눈에 파악할 수 있게 도와줍니다.",
    pageUrl: "https://www.brify.app/ko/mind-map",
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
    title: "YouTube to Mind Map | Convert YouTube Transcripts into Mind Maps | Brify",
    description:
      "Brify helps you convert YouTube transcripts, webpages, and long text into mind maps so you can understand flow and structure at a glance.",
    pageUrl: "https://www.brify.app/en/mind-map",
    heading: "Convert YouTube transcripts into mind maps",
    lead:
      "If you want a YouTube to mind map workflow, Brify helps you convert YouTube transcripts into mind maps and revisit complex content more easily.",
    paragraphs: [
      "A mind map is not only a neat format. It is a way to understand relationships, hierarchy, and flow inside complex information.",
      "Brify helps you convert YouTube transcripts into mind maps so key ideas and their connections become easier to see.",
      "That makes Brify especially useful if you are searching for a way to turn YouTube videos into mind maps for study, research, comparison, and complex inputs.",
    ],
    bullets: [
      "People who want to convert YouTube content into mind maps",
      "People who want long text at a glance",
      "People who want visual flow and structure",
      "People who compare multiple sources and ideas",
    ],
    ctaTitle: "Start organizing with Brify mind maps",
    ctaBody:
      "Convert YouTube transcripts, webpages, and long text into mind maps and understand complex information faster.",
    primaryCta: "Start Brify",
    secondaryCta: "See YouTube notes page",
    signupHref: "/en/signup",
    relatedHref: "/en/youtube-notes",
  },
  fr: {
    title: "Carte mentale YouTube | Convertir une transcription YouTube en carte mentale | Brify",
    description:
      "Brify convertit les transcriptions YouTube, les pages web et les textes longs en cartes mentales pour comprendre rapidement le flux et la structure.",
    pageUrl: "https://www.brify.app/fr/mind-map",
    heading: "Transformez les transcriptions YouTube en cartes mentales",
    lead:
      "Si vous cherchez un workflow YouTube vers carte mentale, Brify vous aide à structurer et revoir les contenus complexes plus facilement.",
    paragraphs: [
      "Une carte mentale n'est pas seulement jolie: elle aide à comprendre les relations, la hiérarchie et le flux des informations complexes.",
      "Brify transforme les transcriptions YouTube en cartes mentales pour rendre les idées clés et leurs liens plus visibles.",
      "C'est particulièrement utile pour l'étude, la recherche, la comparaison de sources et les contenus longs.",
    ],
    bullets: [
      "Personnes qui veulent convertir YouTube en carte mentale",
      "Personnes qui veulent voir des textes longs d'un seul coup d'oeil",
      "Personnes qui veulent une compréhension visuelle du flux",
      "Personnes qui comparent plusieurs sources et idées",
    ],
    ctaTitle: "Commencez à organiser avec Brify",
    ctaBody:
      "Convertissez les transcriptions YouTube, pages web et textes longs en cartes mentales pour comprendre plus vite.",
    primaryCta: "Commencer Brify",
    secondaryCta: "Voir la page notes YouTube",
    signupHref: "/fr/signup",
    relatedHref: "/fr/youtube-notes",
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const copy = locale === "ko" ? PAGE_COPY.ko : locale === "fr" ? PAGE_COPY.fr : PAGE_COPY.en;

  return {
    title: copy.title,
    description: copy.description,
    keywords:
      locale !== "ko"
        ? ["mind map", "youtube mind map", "youtube to mind map", "convert youtube to mind map", "text mind map", "Brify"]
        : ["마인드맵", "유튜브 마인드맵", "텍스트 마인드맵", "정보 정리", "브리피", "브라이피"],
    alternates: {
      canonical: copy.pageUrl,
      languages: {
        ko: PAGE_COPY.ko.pageUrl,
        en: PAGE_COPY.en.pageUrl,
        fr: "https://www.brify.app/fr/mind-map",
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
            locale !== "ko"
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
        locale !== "ko"
          ? "https://www.brify.app/images/sns_en.png"
          : "https://www.brify.app/images/sns_ko.png",
      ],
    },
  };
}

export default async function MindMapPage({ params }: PageProps) {
  const { locale } = await params;
  const copy = locale === "ko" ? PAGE_COPY.ko : locale === "fr" ? PAGE_COPY.fr : PAGE_COPY.en;

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
