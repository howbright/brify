"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import ClientUserMenu from "./ClientUserMenu";
import ClientMobileUserMenu from "./ClientMobileMenu";
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import Image from "next/image";

type Props = {
  isAuthed: boolean;
  email: string | null;
};

export default function ClientHeaderShell({ isAuthed, email }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations("Header");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  // ✅ A 방법: pathname에 따른 분기 제거 (서버/클라 불일치 원천 차단)
  // homeLike 처리 없이 항상 동일한 배경 로직만 사용
  const headerClassName = [
    "fixed top-0 inset-x-0 z-40 transition-all",
    scrolled
      ? "bg-white/90 dark:bg-neutral-900/80 border-b border-slate-400 dark:border-white/20 shadow-sm"
      : [
          " border-b border-slate-300 dark:border-white/20",
          "bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.16),transparent_56%),radial-gradient(circle_at_100%_0%,rgba(129,140,248,0.18),transparent_56%),linear-gradient(90deg,rgba(255,255,255,0.98),rgba(239,246,255,0.98),rgba(255,255,255,0.98))]",
          "dark:bg-[#020617]",
          "dark:bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.45),transparent_60%),radial-gradient(circle_at_100%_0%,rgba(129,140,248,0.5),transparent_60%)]",
        ].join(" "),
  ].join(" ");

  return (
    <header className={headerClassName} role="banner">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex h-[64px] items-center justify-between">
          {/* 좌측 로고 */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/newlogo.png"
              alt="Brify"
              width={512}
              height={512}
              className="h-10 w-10 transition-transform hover:scale-[1.02]"
              priority
            />
            <span className="text-[25px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Brify
            </span>
          </Link>

          {/* 가운데 내비 — md 이상에서만 표시 */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/demo"
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 border border-slate-400 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              {t("nav.samples")}
            </Link>
            <Link
              href={{ pathname: "/", hash: "about" }}
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 border border-slate-400 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              {t("nav.about")}
            </Link>
            <Link
              href={{ pathname: "/", hash: "pricing" }}
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 border border-slate-400 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              {t("nav.pricing")}
            </Link>
            <Link
              href="/support"
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 border border-slate-400 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              {t("nav.contactFeedback")}
            </Link>
          </nav>

          {/* 우측 액션 – 데스크탑 (md 이상) */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthed && (
              <>
                <LanguageSelector />
                <ThemeToggle />
              </>
            )}

            {!isAuthed ? (
              <div className="flex items-center gap-2">
                {/* ✅ A 방법: CTA는 항상 동일하게(텍스트/스타일 고정) */}
                <Link
                  href="/login"
                  className="
                    text-sm px-4 py-2 rounded-full
                    bg-blue-600 text-white
                    hover:bg-blue-700
                    hover:shadow-lg
                    transition-transform hover:scale-[1.03] active:scale-100
                    dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                  "
                >
                  {t("auth.signup")}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* ✚ 새 구조맵 버튼 (데스크탑) */}
                <Link
                  href="/video-to-map"
                  className="
                    group inline-flex items-center gap-2
                    rounded-full px-4 py-2.5 text-sm font-semibold
                    bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500
                    text-white shadow-[0_10px_30px_rgba(37,99,235,0.40)]
                    hover:shadow-[0_14px_40px_rgba(79,70,229,0.60)]
                    transition-all duration-150
                    hover:-translate-y-0.5 hover:scale-[1.03] active:scale-100
                  "
                >
                  <span
                    className="
                      inline-flex h-6 w-6 items-center justify-center
                      rounded-full border border-white/50
                      bg-white/15 shadow-sm
                    "
                  >
                    <Icon icon="lucide:plus" className="h-3.5 w-3.5" />
                  </span>
                  <span>{t("cta.newMap")}</span>
                </Link>

                {/* 나의 맵 – 세컨더리 텍스트 버튼 스타일 */}
                <Link
                  href="/maps"
                  className="
                    text-sm font-medium
                    px-2.5 py-1.5 rounded-lg
                    text-neutral-700 dark:text-neutral-200
                    hover:text-neutral-900 dark:hover:text-white
                    hover:bg-white/70 dark:hover:bg-white/5
                    border border-transparent hover:border-slate-400 dark:hover:border-white/20
                    transition-colors
                  "
                >
                  {t("cta.myMaps")}
                </Link>

                <ClientUserMenu email={email} />
              </div>
            )}
          </div>

          {/* 모바일 – 새 구조맵 버튼 + 모바일 메뉴 (md 미만) */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthed && (
              <Link
                href="/video-to-map"
                className="
                  inline-flex items-center gap-1.5
                  rounded-full px-3 py-1.5 text-xs font-semibold
                  bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500
                  text-white
                  shadow-[0_8px_22px_rgba(37,99,235,0.45)]
                  hover:shadow-[0_10px_28px_rgba(79,70,229,0.65)]
                  transition-all duration-150
                  hover:-translate-y-0.5 active:translate-y-0
                "
              >
                <span
                  className="
                    inline-flex h-5 w-5 items-center justify-center
                    rounded-full border border-white/50
                    bg-white/15 shadow-sm
                  "
                >
                  <Icon icon="lucide:plus" className="h-3 w-3" />
                </span>
                <span>{t("cta.newMap")}</span>
              </Link>
            )}

            <ClientMobileUserMenu isAuthed={isAuthed} email={email} />
          </div>
        </div>
      </div>
    </header>
  );
}
