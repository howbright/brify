"use client";

import SignupForm from "@/components/SignupForm";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

export default function Signup() {
  const t = useTranslations("signupPage");
  const locale = useLocale();
  const prelaunchTitle =
    locale === "ko" ? "서비스가 준비중입니다." : "The service is currently in preparation.";
  const launchNotice =
    locale === "ko"
      ? "4월 초 정식 오픈합니다. 조금만 더 기다려주세요."
      : "Official launch is planned for early April. Please wait just a little longer.";

  return (
    <main
      className="
        relative min-h-screen w-full
        bg-[#f4f6fb] dark:bg-[#020617]
        text-neutral-900 dark:text-neutral-50
        pt-[86px] pb-16
        flex items-start justify-center md:pt-[142px]
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
        <div className="mb-5 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-neutral-900 dark:text-neutral-100"
          >
            <Image
              src="/images/newlogo.png"
              alt="Brify Logo"
              className="h-9 w-9"
              width={512}
              height={512}
            />
            <span className="text-[24px] font-extrabold tracking-tight">
              {t("brand")}
            </span>
          </Link>
        </div>

        <div className="mb-5 rounded-2xl border border-blue-200/80 bg-blue-50/90 px-5 py-4 text-center text-[16px] font-semibold leading-7 text-blue-900 shadow-sm dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100 sm:text-[17px]">
          <p className="text-[18px] font-extrabold leading-7 sm:text-[19px]">
            {prelaunchTitle}
          </p>
          <p className="mt-1.5 text-[16px] font-bold leading-7 text-blue-700 dark:text-blue-200/90 sm:text-[17px]">
            {launchNotice}
          </p>
        </div>

        {/* 회원가입 카드 */}
        <SignupForm />
      </div>
    </main>
  );
}
