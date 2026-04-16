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
    "Brify는 긴 글과 영상을 구조맵으로 정리해, 세부정보를 놓치지 않으면서 필요한 정보를 빠르게 파악할 수 있게 도와줍니다. 텍스트, 웹페이지, YouTube를 한눈에 읽어보세요.",
  metadataBase: new URL("https://brify.app"),
  openGraph: {
    title: "Brify – 긴 글을 한눈에 정리하세요",
    description:
      "Brify는 긴 글과 영상을 구조맵으로 정리해, 세부정보를 놓치지 않으면서 필요한 정보를 빠르게 파악할 수 있게 도와줍니다. 텍스트, 웹페이지, YouTube를 한눈에 읽어보세요.",
    url: "https://brify.app",
    siteName: "Brify",
    images: [
      {
        url: "https://brify.app/images/hero/hero1.png",
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
      "Brify는 긴 글과 영상을 구조맵으로 정리해, 세부정보를 놓치지 않으면서 필요한 정보를 빠르게 파악할 수 있게 도와줍니다. 텍스트, 웹페이지, YouTube를 한눈에 읽어보세요.",
    images: ["https://brify.app/images/hero/hero1.png"],
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
