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


export const metadata: Metadata = {
  title: "Brify – 긴 글을 한눈에 정리하세요",
  description:
    "Brify는 긴 글을 빠르게 요약하고, 다이어그램으로 시각화하며, 태그로 정리해주는 AI 요약 서비스입니다. 텍스트, 웹페이지, YouTube 영상까지 간편하게 정리하세요.",
  metadataBase: new URL("https://brify.ai"),
  openGraph: {
    title: "Brify – 긴 글을 한눈에 정리하세요",
    description:
      "AI가 긴 글을 요약하고 시각화해줍니다. YouTube 영상, 웹페이지, 문서까지 Brify 하나로 정리하세요.",
    url: "https://brify.ai",
    siteName: "Brify",
    images: [
      {
        url: "https://brify.ai/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Brify Open Graph Image",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brify – 긴 글을 한눈에 정리하세요",
    description:
      "긴 글 요약, 다이어그램 시각화, 태그 정리까지 Brify로 한 번에!",
    images: ["https://brify.ai/images/og-image.png"],
  },
};

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
