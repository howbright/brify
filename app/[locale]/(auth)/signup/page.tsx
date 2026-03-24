"use client";

import SignupForm from "@/components/SignupForm";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function Signup() {
  const t = useTranslations("signupPage");

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

        {/* 회원가입 카드 */}
        <SignupForm />
      </div>
    </main>
  );
}
