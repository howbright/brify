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
    title: "AI 문서 구조화 도구 | 긴 문서를 구조맵으로 더 빠르고 정확한 판단 - Brify",
    ogTitle: "긴 문서 판단을 위한 AI 문서 구조화 도구 | Brify",
    description:
      "브라이피는 길고 복잡한 문서를 구조화해 핵심 흐름과 세부 정보를 함께 보여주는 AI 문서 구조화 도구입니다. 더 빠르고 정확한 판단을 도와줍니다.",
    imageUrl: "https://www.brify.app/images/snsKo.jpg",
    ogLocale: "ko_KR",
    keywords: [
      "AI 문서 구조화",
      "문서 구조화",
      "긴 문서 정리",
      "전문 문서 정리",
      "논문 정리",
      "판례 정리",
      "보고서 정리",
      "구조맵",
      "문서 비교",
      "브리피",
      "브라이피",
      "Brify",
    ],
  },
  en: {
    title: "AI Document Structuring | Structure Long Documents for Better Decisions - Brify",
    ogTitle: "AI Document Structuring for Long-Document Decisions | Brify",
    description:
      "Brify is an AI document structuring tool for long, complex documents. It structures core flow and critical details so you can review faster and decide with confidence.",
    imageUrl: "https://www.brify.app/images/snsEn.jpg",
    ogLocale: "en_US",
    keywords: [
      "AI document structuring",
      "document structuring",
      "long document analysis",
      "research paper analysis",
      "legal document review",
      "report analysis",
      "structure map",
      "Brify",
    ],
  },
  fr: {
    title: "Structuration de documents par IA | Structurez les documents longs pour mieux décider - Brify",
    ogTitle: "Structuration de documents par IA pour documents complexes | Brify",
    description:
      "Brify est un outil de structuration de documents par IA pour les documents longs et complexes. Il structure la logique centrale et les détails clés pour une lecture plus rapide et des décisions plus fiables.",
    imageUrl: "https://www.brify.app/images/snsEn.jpg",
    ogLocale: "fr_FR",
    keywords: [
      "structuration de documents par IA",
      "structuration de documents",
      "analyse de documents longs",
      "analyse d'article de recherche",
      "revue de document juridique",
      "analyse de rapport",
      "carte structurée",
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
    other: {
      google: "notranslate",
    },
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
