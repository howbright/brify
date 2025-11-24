"use client";

import SignupForm from "@/components/SignupForm";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Signup() {
  const t = useTranslations("signupPage");

  return (
    <main
      className="
        relative min-h-screen w-full
        bg-[#f4f6fb] dark:bg-[#020617]
        text-neutral-900 dark:text-neutral-50
        pt-20 pb-16
        flex items-start md:items-center justify-center
      "
    >
      {/* 상단 블루 톤 그라데이션 */}
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 h-72 -z-10
          bg-[radial-gradient(900px_380px_at_20%_0%,rgb(var(--hero-a)_/_0.16),transparent_65%),radial-gradient(900px_380px_at_80%_0%,rgb(var(--hero-b)_/_0.14),transparent_65%)]
        "
      />
      {/* 전체 얇은 그리드 */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          [mask-image:linear-gradient(to_bottom,black,transparent_70%)]
          bg-[linear-gradient(to_right,rgb(var(--hero-grid)_/_0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--hero-grid)_/_0.035)_1px,transparent_1px)]
          bg-[size:26px_26px]
          opacity-60
          dark:opacity-30
        "
      />

      <div className="relative w-full max-w-md px-4 sm:px-0">
        {/* 상단 작은 브랜딩 + 한 줄 카피 */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100"
          >
            <div
              className="
                h-8 w-8 rounded-2xl bg-white/90 dark:bg-white/10
                shadow-md flex items-center justify-center
                text-sm font-black text-blue-600 dark:text-[rgb(var(--hero-b))]
              "
            >
              B
            </div>
            <span className="tracking-tight">
              {t("brand")}
            </span>
          </Link>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t("tagline")}
          </p>
        </div>

        {/* 회원가입 카드 */}
        <SignupForm />
      </div>
    </main>
  );
}
