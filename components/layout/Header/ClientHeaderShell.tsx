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

  // "/", "/ko", "/en" 같은 루트 성격 페이지는 hero 위에 떠 있는 느낌 유지

  // 1️⃣ 홈처럼 취급할 경로를 명시적으로 정의
  const homeLikePaths = ["/", "/ko", "/en"];
  const isHomeLike = homeLikePaths.includes(pathname);
  
  // 2️⃣ 클래스 분기
  const headerClassName = [
    "fixed top-0 inset-x-0 z-40 transition-all",
    scrolled
      ? // ✅ 스크롤된 상태: 모든 페이지 공통 (지금과 동일)
        "bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md border-b border-black/10 dark:border-white/10 shadow-sm"
      : isHomeLike
      ? // ✅ 홈 상단: 완전 투명(기존 hero에 떠있는 느낌 유지)
        "bg-transparent dark:bg-neutral-950/45 dark:backdrop-blur supports-[backdrop-filter]:dark:bg-neutral-950/35 dark:border-b dark:border-white/10"
      : // ✅ 이름 있는 페이지 상단: 오묘한 그라데이션 바
        [
          "backdrop-blur-md border-b border-black/5 dark:border-white/10",
          // 라이트: 파란 기조의 살짝 비치는 헤더
          "bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.16),transparent_56%),radial-gradient(circle_at_100%_0%,rgba(129,140,248,0.18),transparent_56%),linear-gradient(90deg,rgba(255,255,255,0.98),rgba(239,246,255,0.98),rgba(255,255,255,0.98))]",
          // 다크: 진한 남색 위에 파란 그라데이션
          "dark:bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.45),transparent_60%),radial-gradient(circle_at_100%_0%,rgba(129,140,248,0.5),transparent_60%),#020617]",
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
            <Link
              href="/video-to-map"
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur border border-white/50 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              핵심정리
            </Link>
            <Link
              href="/pricing"
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur border border-white/50 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              가격
            </Link>
            <Link
              href="/my-summaries"
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur border border-white/50 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              나의 스크랩북
            </Link>
            <Link
              href="/tags"
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur border border-white/50 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              태그
            </Link>
          </nav>

          {/* 우측 액션 */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />
            <ThemeToggle />
            {!isAuthed ? (
              <>
                <Link
                  href="/pricing"
                  className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur border border-white/50 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  가격
                </Link>
                <Link
                  href="/login"
                  className="text-sm px-4 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:shadow-lg transition-transform hover:scale-[1.03] active:scale-100"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="text-sm px-4 py-2 rounded-full bg-blue-600 text-white hover:shadow-lg transition-transform hover:scale-[1.03] active:scale-100"
                >
                  회원가입
                </Link>
              </>
            ) : (
              <ClientUserMenu email={email} />
            )}
          </div>

          {/* 모바일 메뉴 */}
          <div className="md:hidden">
            <ClientMobileMenu
              isAuthed={isAuthed}
              email={email}
              navItems={[
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
