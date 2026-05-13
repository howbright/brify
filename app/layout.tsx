// app/layout.tsx
import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function resolveLocaleFromPathname(pathname: string | null | undefined) {
  const segment = pathname?.split("/").filter(Boolean)[0];
  if (segment === "ko" || segment === "en" || segment === "fr") {
    return segment;
  }
  return null;
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headerStore = await headers();
  const pathnameLocale = resolveLocaleFromPathname(
    headerStore.get("x-pathname")
  );
  const cookieStore = await cookies();
  const v = cookieStore.get("NEXT_LOCALE")?.value;

  // Root html lang should support every public locale.
  // (Admin locale policy is handled in admin routes.)
  const locale: "en" | "ko" | "fr" =
    pathnameLocale ??
    (v === "en" || v === "ko" || v === "fr" ? v : "en");

  return (
    <html
      lang={locale}
      translate="no"
      className="notranslate"
      suppressHydrationWarning
    >
      <body
        className={`notranslate ${geistSans.variable} ${geistMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
