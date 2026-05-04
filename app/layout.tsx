// app/layout.tsx
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const v = cookieStore.get("NEXT_LOCALE")?.value;

  // Root html lang should support every public locale.
  // (Admin locale policy is handled in admin routes.)
  const locale: "en" | "ko" | "fr" =
    v === "en" || v === "ko" || v === "fr" ? v : "en";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
