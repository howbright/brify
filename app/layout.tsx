// app/layout.tsx
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  display: "swap",
  variable: "--font-pretendard",
  weight: "45 920",
});

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const v = cookieStore.get("NEXT_LOCALE")?.value;

  // 관리자는 한국인 기본값 ko
  const locale: "en" | "ko" = v === "en" || v === "ko" ? v : "ko";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pretendard.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
