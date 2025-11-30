"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import ClientUserMenu from "./ClientUserMenu";
import ClientMobileMenu from "./ClientMobileMenu";
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";

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
            <div className="h-9 w-9 rounded-2xl bg-white/90 dark:bg:white/10 shadow-md flex items-center justify-center transition-transform hover:scale-[1.03]">
              <span className="font-black text-blue-600">B</span>
            </div>
            <span className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Brify
            </span>
          </Link>

          {/* 가운데 내비 — lg 이상에서만 */}
          <nav className="hidden lg:flex items-center gap-2">
            {!isAuthed ? (
              <>
                {/* 비로그인: 샘플 + 가격만 */}
                <Link
                  href="/samples" // 필요하면 실제 샘플 페이지 경로로 수정
                  className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur border border-white/50 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  구조맵 샘플
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm px-3 py-2 rounded-full bg:white/60 dark:bg-white/10 backdrop-blur border border-white/50 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  가격
                </Link>
              </>
            ) : (
              <>
                {/* 로그인 후: 필요하면 핵심 기능 메뉴들 배치 */}
                <Link
                  href="/video-to-map"
                  className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg:white/10 backdrop-blur border border-white/50 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  영상을 구조맵로 변환
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm px-3 py-2 rounded-full bg:white/60 dark:bg-white/10 backdrop-blur border border-white/50 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  가격
                </Link>
              </>
            )}
          </nav>

          {/* 우측 액션 */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />
            <ThemeToggle />

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
                    dark:bg-[rgb(var(--hero-a))] dark:hover:bg:[rgb(var(--hero-b))]
                  "
                >
                  무료로 시작하기
                </Link>
              </div>
            ) : (
              <>
                {/* 로그인 후: '나의 맵' 버튼 + 유저 메뉴 */}
                <Link
                  href="/my-summaries" // 혹은 /my-maps 등 실제 경로
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
                <ClientUserMenu email={email} />
              </>
            )}
          </div>

          {/* 모바일 메뉴 */}
          <div className="md:hidden">
            <ClientMobileMenu
              isAuthed={isAuthed}
              email={email}
              navItems={[
                // TODO: 여기도 나중에 비로그인/로그인에 따라 샘플/나의 맵 등 분기해도 좋음
                {
                  href: "/summarize",
                  label: "핵심정리하기",
                  icon: "mdi:file-document-edit",
                },
                {
                  href: "/my-summaries",
                  label: "나의 스크랩북",
                  icon: "mdi:folder",
                },
                {
                  href: "/tags",
                  label: "태그 보기",
                  icon: "mdi:tag-multiple",
                },
                ...(isAuthed
                  ? [
                      {
                        href: "/billing",
                        label: "결제/크레딧",
                        icon: "mdi:credit-card",
                      } as const,
                    ]
                  : []),
                {
                  href: "/pricing",
                  label: "요금제",
                  icon: "mdi:currency-krw",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
