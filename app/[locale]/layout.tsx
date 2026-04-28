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
    title: "Brify – 유튜브 요약, 유튜브 정리, 마인드맵으로 복잡한 정보 한눈에",
    description:
      "Brify는 유튜브 대본, 웹페이지, 긴 텍스트를 마인드맵으로 정리해 복잡한 정보의 흐름과 구조를 한눈에 파악할 수 있게 도와줍니다.",
    imageUrl: "https://brify.app/images/sns_ko.png",
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
      "브리피",
    ],
  },
  en: {
    title: "Brify – Turn YouTube, webpages, and long text into mind maps",
    description:
      "Brify helps you organize long videos and text into visual maps so you can understand complex information at a glance.",
    imageUrl: "https://brify.app/images/sns_en.png",
    ogLocale: "en_US",
    keywords: [
      "youtube summary",
      "youtube notes",
      "youtube mind map",
      "mind map",
      "long text summary",
      "webpage summary",
      "information organization",
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
  const isEnglish = locale === "en";
  const copy = isEnglish ? SEO_COPY.en : SEO_COPY.ko;
  const pageUrl = `https://brify.app/${isEnglish ? "en" : "ko"}`;

  return {
    title: copy.title,
    description: copy.description,
    keywords: [...copy.keywords],
    metadataBase: new URL("https://brify.app"),
    alternates: {
      canonical: pageUrl,
      languages: {
        ko: "https://brify.app/ko",
        en: "https://brify.app/en",
      },
    },
    openGraph: {
      title: copy.title,
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
      title: copy.title,
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
