"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

function isHiddenPath(pathname: string | null) {
  if (!pathname) return true;
  return (
    pathname.includes("/admin") ||
    pathname.includes("/support") ||
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/privacy") ||
    pathname.includes("/terms") ||
    pathname.includes("/refund-policy") ||
    pathname.includes("/challengeclip")
  );
}

export default function FeedbackRewardFab() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("FeedbackRewardFab");

  if (isHiddenPath(pathname)) return null;

  const safeLocale = locale === "ko" || locale === "en" || locale === "fr" ? locale : "ko";
  const href = `/${safeLocale}/support?intent=bug-reward&from=${encodeURIComponent(
    pathname ?? `/${safeLocale}`
  )}`;

  return (
    <Link
      href={href}
      className="fixed bottom-5 right-4 z-40 inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-sm font-black text-white shadow-[0_18px_46px_-18px_rgba(220,38,38,0.86)] ring-1 ring-red-400/45 transition hover:-translate-y-0.5 hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-300/45 sm:right-5 lg:right-6 dark:bg-red-500 dark:hover:bg-red-400"
      aria-label={t("aria")}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/16">
        <Icon icon="lucide:message-circle-warning" className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate leading-4">{t("title")}</span>
        <span className="block truncate text-[11px] font-extrabold leading-4 text-red-50/92">
          {t("reward")}
        </span>
      </span>
    </Link>
  );
}
