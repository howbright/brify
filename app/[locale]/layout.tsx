//app/[locale]/layout.tsx

import { SessionProvider } from "@/components/SessionProvider";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import "mind-elixir/style.css";
import "../globals.css";
import { ReactQueryProvider } from "../providers";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { createClient } from "@/utils/supabase/server";
import AuthRscRefresher from "@/components/AuthRscRefresher";
import ThemeProvider from "@/components/ThemeProvider";
import GlobalNotificationStack from "@/components/notifications/GlobalNotificationStack";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SEO_COPY = {
  ko: {
    title: "AI 마인드맵 변환 | 텍스트·유튜브를 구조맵으로 - Brify",
    ogTitle: "AI 마인드맵 변환 | Brify",
    description:
      "브라이피(Brify)는 길고 복잡한 문서·논문·리포트를 AI 마인드맵으로 구조화해 핵심 흐름과 세부 정보를 빠르게 파악할 수 있게 돕습니다.",
    imageUrl: "https://www.brify.app/images/sns_ko.png",
    ogLocale: "ko_KR",
    keywords: [
      "유튜브 요약",
      "유튜브 정리",
      "유튜브 마인드맵",
      "마인드맵",
      "긴 글 요약",
      "웹페이지 요약",
      "정보 정리",
      "유튜브 대본 요약",
      "유튜브 대본 정리",
      "AI 마인드맵 변환",
      "브리피",
      "브라이피",
      "Brify",
    ],
  },
  en: {
    title: "AI mind map conversion | Turn text and YouTube into structured maps - Brify",
    ogTitle: "AI mind map conversion | Brify",
    description:
      "Brify turns long, complex documents, papers, and reports into AI mind maps so you can quickly understand core logic and critical details.",
    imageUrl: "https://www.brify.app/images/sns_en.png",
    ogLocale: "en_US",
    keywords: [
      "youtube summary",
      "youtube notes",
      "youtube mind map",
      "AI mind map conversion",
      "mind map",
      "long text summary",
      "webpage summary",
      "information organization",
      "Brify",
    ],
  },
  fr: {
    title: "Conversion IA en carte mentale | Transformez texte et YouTube en cartes structurées - Brify",
    ogTitle: "Conversion IA en carte mentale | Brify",
    description:
      "Brify transforme des documents, articles et rapports longs et complexes en mind maps IA pour vous aider à comprendre rapidement la logique principale et les détails essentiels.",
    imageUrl: "https://www.brify.app/images/sns_en.png",
    ogLocale: "fr_FR",
    keywords: [
      "résumé youtube",
      "notes youtube",
      "mind map youtube",
      "conversion IA en carte mentale",
      "mind map",
      "résumé de texte long",
      "résumé de page web",
      "organisation d'information",
      "Brify",
    ],
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy =
    locale === "ko" ? SEO_COPY.ko : locale === "fr" ? SEO_COPY.fr : SEO_COPY.en;
  const pageLocale = locale === "ko" ? "ko" : locale === "fr" ? "fr" : "en";
  const pageUrl = `https://www.brify.app/${pageLocale}`;

  return {
    title: copy.title,
    description: copy.description,
    keywords: [...copy.keywords],
    metadataBase: new URL("https://www.brify.app"),
    alternates: {
      canonical: pageUrl,
      languages: {
        ko: "https://www.brify.app/ko",
        en: "https://www.brify.app/en",
        fr: "https://www.brify.app/fr",
        "x-default": "https://www.brify.app/en",
      },
    },
    openGraph: {
      title: copy.ogTitle,
      description: copy.description,
      url: pageUrl,
      siteName: "Brify",
      images: [
        {
          url: copy.imageUrl,
          width: 1200,
          height: 630,
          alt: copy.title,
        },
      ],
      locale: copy.ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.ogTitle,
      description: copy.description,
      images: [copy.imageUrl],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const safeSession = user ? session : null;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <ThemeProvider>
      {" "}
      {/* ✅ 여기! 최상단에 감싸주기 */}
      <ReactQueryProvider>
        <SessionProvider session={safeSession}>
          <AuthRscRefresher /> {/* ← 여기! 헤더보다 위든 아래든 상관 없음 */}
          <NextIntlClientProvider locale={locale} messages={messages}>
            <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
            <GlobalNotificationStack />
          </NextIntlClientProvider>
          <Toaster
            richColors
            position="top-center"
            duration={2400}
            toastOptions={{
              className:
                "rounded-2xl border border-slate-200/90 bg-slate-800/95 px-4 py-3 text-lg font-semibold leading-7 text-slate-50 shadow-[0_20px_45px_-22px_rgba(15,23,42,0.56)]",
              style: {
                background: "rgba(30, 41, 59, 0.94)",
                color: "#f8fafc",
                borderColor: "rgba(226, 232, 240, 0.88)",
              },
            }}
          />
        </SessionProvider>
      </ReactQueryProvider>
    </ThemeProvider>
  );
}
