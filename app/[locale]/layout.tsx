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
    title: "긴 문서를 상세정보까지 담은 구조로 정리 | Brify",
    ogTitle: "긴 문서를 상세정보까지 담은 구조맵으로 정리 | Brify",
    description:
      "Brify는 긴 문서를 요약으로 줄이는 대신 원문 근거와 세부 흐름을 보존한 구조맵으로 변환합니다. 논문, 보고서, 전문 자료를 읽고, 편집하고, 공유하기 쉽게 정리하세요.",
    imageUrl: "https://www.brify.app/images/snsKo.jpg",
    ogLocale: "ko_KR",
    keywords: [
      "AI 구조맵 도구",
      "대학원생 논문 정리",
      "연구자 자료 정리",
      "리포트 준비",
      "논문 정리",
      "긴 자료 정리",
      "긴 글 구조화",
      "구조맵",
      "브리피",
      "브라이피",
      "Brify",
    ],
  },
  en: {
    title: "Organize Long Documents With Detail-Preserving Structure Maps | Brify",
    ogTitle: "Turn Long Documents Into Structures That Keep the Details | Brify",
    description:
      "Brify turns long documents into source-grounded structure maps instead of reducing them to short summaries. Organize papers, reports, and professional materials in a way you can review, refine, and share.",
    imageUrl: "https://www.brify.app/images/snsEn.jpg",
    ogLocale: "en_US",
    keywords: [
      "AI structure map",
      "graduate student research tool",
      "research paper organization",
      "report preparation",
      "long material analysis",
      "paper summary map",
      "structure map",
      "Brify",
    ],
  },
  fr: {
    title: "Organiser les documents longs en cartes structurées détaillées | Brify",
    ogTitle: "Transformez les documents longs en structures qui gardent les détails | Brify",
    description:
      "Brify transforme les documents longs en cartes structurées ancrées dans le texte source, au lieu de les réduire à de simples résumés. Organisez articles, rapports et documents spécialisés pour les relire, les affiner et les partager.",
    imageUrl: "https://www.brify.app/images/snsEn.jpg",
    ogLocale: "fr_FR",
    keywords: [
      "carte structurée IA",
      "outil pour doctorants",
      "organisation article de recherche",
      "préparation de rapport",
      "analyse de documents longs",
      "carte pour article scientifique",
      "carte structurée",
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
