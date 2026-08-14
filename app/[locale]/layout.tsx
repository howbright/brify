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
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SEO_COPY = {
  ko: {
    title: "긴 글을 마인드맵으로 변환 | 상세정보 포함 AI 마인드맵 - Brify",
    ogTitle: "긴 글을 상세정보까지 담은 마인드맵으로 변환 | Brify",
    description:
      "Brify는 긴 글을 요약으로 줄이지 않고 상세정보를 포함한 편집·공유 가능한 마인드맵으로 변환합니다. 논문, 강의 노트, 보고서, 유튜브 대본, 책, 회의록, 설교 원고, 정책 문서를 구조화하세요.",
    imageUrl: "https://www.brify.app/images/snsKo.jpg",
    ogLocale: "ko_KR",
    keywords: [
      "긴 글 마인드맵",
      "마인드맵 변환",
      "AI 마인드맵",
      "상세정보 마인드맵",
      "긴 글 정리",
      "유튜브 대본 구조화",
      "논문 마인드맵",
      "보고서 분석",
      "편집 가능한 마인드맵",
      "공유 가능한 마인드맵",
      "브리피",
      "브라이피",
      "Brify",
    ],
  },
  en: {
    title: "Long Text to Mind Map | Detail-Preserving AI Mind Maps - Brify",
    ogTitle: "Turn Long Text Into a Mind Map That Keeps the Details | Brify",
    description:
      "Brify converts long text into editable, shareable mind maps that keep the details instead of reducing everything to a short summary. Use it for papers, lecture notes, reports, YouTube transcripts, books, meeting notes, sermons, and professional documents.",
    imageUrl: "https://www.brify.app/images/snsEn.jpg",
    ogLocale: "en_US",
    keywords: [
      "long text to mind map",
      "AI mind map",
      "mind map generator",
      "detailed mind map",
      "convert text to mind map",
      "YouTube transcript mind map",
      "paper mind map",
      "report analysis",
      "editable mind map",
      "shareable mind map",
      "Brify",
    ],
  },
  fr: {
    title: "Texte long en carte mentale | Carte IA avec détails - Brify",
    ogTitle: "Transformez un texte long en carte mentale qui garde les détails | Brify",
    description:
      "Brify transforme les textes longs en cartes mentales modifiables et partageables qui conservent les détails au lieu de tout réduire à un résumé. Pour articles, notes de cours, rapports, transcriptions YouTube, livres, réunions, sermons et documents professionnels.",
    imageUrl: "https://www.brify.app/images/snsEn.jpg",
    ogLocale: "fr_FR",
    keywords: [
      "texte long en carte mentale",
      "carte mentale IA",
      "générateur de carte mentale",
      "carte mentale détaillée",
      "convertir un texte en carte mentale",
      "transcription YouTube en carte mentale",
      "article en carte mentale",
      "analyse de rapport",
      "carte mentale modifiable",
      "carte mentale partageable",
      "Brify",
    ],
  },
} as const;

function getSeoCopy(locale: string) {
  return locale === "ko" ? SEO_COPY.ko : locale === "fr" ? SEO_COPY.fr : SEO_COPY.en;
}

function getPageLocale(locale: string) {
  return locale === "ko" ? "ko" : locale === "fr" ? "fr" : "en";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getSeoCopy(locale);
  const pageLocale = getPageLocale(locale);
  const pageUrl = `https://www.brify.app/${pageLocale}`;

  return {
    applicationName: "Brify",
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
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const cookieStore = await cookies();
  const hasSignupIntent = cookieStore.get("brify_signup_terms")?.value === "1";

  if (user && hasSignupIntent) {
    redirect(`/auth/signup-redirect?locale=${encodeURIComponent(locale)}`);
  }

  const safeSession = user ? session : null;

  const messages = await getMessages();
  const pageLocale = getPageLocale(locale);
  const copy = getSeoCopy(locale);
  const pageUrl = `https://www.brify.app/${pageLocale}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.brify.app/#organization",
        name: "Brify",
        url: "https://www.brify.app",
        logo: "https://www.brify.app/images/snsEn.jpg",
      },
      {
        "@type": ["SoftwareApplication", "WebApplication"],
        "@id": "https://www.brify.app/#software",
        name: "Brify",
        url: pageUrl,
        applicationCategory: "ProductivityApplication",
        operatingSystem: "Web",
        inLanguage: pageLocale,
        description: copy.description,
        publisher: {
          "@id": "https://www.brify.app/#organization",
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: pageLocale === "ko" ? "KRW" : "USD",
          availability: "https://schema.org/InStock",
        },
      },
    ],
  };

  return (
    <ThemeProvider>
      {" "}
      {/* ✅ 여기! 최상단에 감싸주기 */}
      <ReactQueryProvider>
        <SessionProvider session={safeSession}>
          <AuthRscRefresher /> {/* ← 여기! 헤더보다 위든 아래든 상관 없음 */}
          <NextIntlClientProvider locale={locale} messages={messages}>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
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
