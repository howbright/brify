// app/layout.tsx
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Inter, Noto_Sans_KR } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${notoSansKr.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
