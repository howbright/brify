"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import ClientUserMenu from "./ClientUserMenu";
import ClientMobileUserMenu from "./ClientMobileMenu";
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
// ✅ 새로 추가 – + 아이콘용
import { Icon } from "@iconify/react";

type Props = {
  isAuthed: boolean;
  email: string | null;
};

export default function ClientHeaderShell({ isAuthed, email }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const homeLikePaths = ["/", "/ko", "/en"];
  const isHomeLike = homeLikePaths.includes(pathname);

  const headerClassName = [
    "fixed top-0 inset-x-0 z-40 transition-all",
    scrolled
      ? "bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md border-b border-black/10 dark:border-white/10 shadow-sm"
      : isHomeLike
      ? "bg-transparent dark:bg-neutral-950/45 dark:backdrop-blur supports-[backdrop-filter]:dark:bg-neutral-950/35 dark:border-b dark:border-white/10"
      : [
          "backdrop-blur-md border-b border-black/5 dark:border-white/10",
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
            <div className="h-9 w-9 rounded-2xl bg-white/90 dark:bg-white/10 shadow-md flex items-center justify-center transition-transform hover:scale-[1.03]">
              <span className="font-black text-blue-600">B</span>
            </div>
            <span className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Brify
            </span>
          </Link>

          {/* 가운데 내비 — lg 이상에서만 */}
          <nav className="hidden lg:flex items-center gap-2">
            {/* 비로그인: 샘플 + 가격만 */}
            <Link
              href="/samples"
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur border border-white/50 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              샘플
            </Link>
            <Link
              href={{ pathname: "/", hash: "pricing" }}
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur border border-white/50 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              요금제
            </Link>
          </nav>

          {/* 우측 액션 */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthed && (
              <>
                <LanguageSelector />
                <ThemeToggle />
              </>
            )}

            {!isAuthed ? (
              <div className="flex items-center gap-2">
                {/* 로그인: 텍스트 링크 스타일 */}
                <Link
                  href="/login"
                  className="
                    text-sm text-neutral-700 dark:text-neutral-200
                    hover:text-neutral-900 dark:hover:text-white
                    underline-offset-4 hover:underline
                    transition-colors
                  "
                >
                  로그인
                </Link>

                {/* 회원가입: 메인 CTA 버튼 */}
                <Link
                  href="/signup"
                  className="
                    text-sm px-4 py-2 rounded-full
                    bg-blue-600 text-white
                    hover:bg-blue-700
                    hover:shadow-lg
                    transition-transform hover:scale-[1.03] active:scale-100
                    dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                  "
                >
                  무료로 시작하기
                </Link>
              </div>
            ) : (
              // ✅ 로그인 후: 새 구조맵 버튼 + 나의 맵 + 유저 메뉴
              <div className="flex items-center gap-3">
                {/* ✚ 큰 생성 버튼 */}
                <Link
                  href="/summarize" // 구조맵 생성 페이지 경로
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
                  <span>새 구조맵 만들기</span>
                </Link>

                {/* 나의 맵 버튼 */}
                <Link
                  href="/my-summaries"
                  className="
                    text-sm px-4 py-2 rounded-full
                    bg-blue-600 text-white
                    hover:bg-blue-700
                    hover:shadow-lg
                    transition-transform hover:scale-[1.03] active:scale-100
                    dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                  "
                >
                  나의 맵
                </Link>

                {/* 유저 메뉴 */}
                <ClientUserMenu email={email} />
              </div>
            )}
          </div>

          {/* 모바일 메뉴 */}
          <div className="md:hidden">
            <ClientMobileUserMenu
              isAuthed={isAuthed}
              email={email}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
