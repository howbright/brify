// components/layout/Header/index.tsx (Server Component)
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/server";
import ClientUserMenu from "./ClientUserMenu"; // 클라 섬
import ClientMobileMenu from "./ClientMobileMenu";
import LanguageSelector from "@/components/LanguageSelector";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthed = !!session;

  // (선택) role까지 서버에서 미리 조회
  const navItems = [
    {
      href: "/summarize",
      label: "핵심정리하기",
      icon: "mdi:file-document-edit",
    },
    { href: "/my-summaries", label: "나의 스크랩북", icon: "mdi:folder" },
    { href: "/tags", label: "태그 보기", icon: "mdi:tag-multiple" },
    ...(isAuthed ? [{ href: "/billing", label: "결제/크레딧" }] : []),
    { href: "/pricing", label: "요금제", icon: "mdi:currency-krw" },
  ];

  return (
    <header>
      <nav className="bg-white/90 dark:bg-background/50 backdrop-blur-md shadow-md py-2.5 fixed w-full z-40 top-0 start-0 border border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
          {/* 로고 */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="Brify Logo"
                className="h-8"
                width={100}
                height={100}
              />
            </Link>
          </div>

          {/* 중앙 메뉴 (lg 이상) */}
          <div className="hidden lg:flex justify-center flex-1">
            <ul className="flex gap-3 xl:gap-5 font-medium">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block px-4 py-2 text-text rounded-md border border-transparent hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 우측 언어/계정 - md 이상 */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSelector />

            {!session ? (
              <>
                <Link
                  href="/login"
                  className="text-primary border border-primary hover:bg-primary/10 font-medium rounded-lg text-sm px-4 py-2 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="text-white bg-primary hover:bg-primary-hover font-medium rounded-lg text-sm px-4 py-2 transition-colors"
                >
                  회원가입
                </Link>
              </>
            ) : (
              <ClientUserMenu email={session.user.email ?? null} />
            )}
          </div>

          {/* ✅ 모바일 메뉴 트리거 + 패널(클라 섬) */}
          <ClientMobileMenu
            isAuthed={!!session}
            email={session?.user?.email ?? null}
            navItems={navItems}
          />
        </div>{" "}
        {/* ← 이거 빠져 있었음 */}
      </nav>
    </header>
  );
}
