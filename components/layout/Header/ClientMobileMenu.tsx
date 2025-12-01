// components/layout/Header/ClientMobileMenu.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggleText } from "@/components/ThemeToggleText";

type NavItem = { href: string; label: string; icon?: string };

export default function ClientMobileUserMenu({
  isAuthed,
  email,
}: {
  isAuthed: boolean;
  email: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // ClientUserMenu와 동일한 divider 스타일
  const dividerClass =
    "my-2 mx-1.5 h-px bg-gradient-to-r " +
    "from-transparent via-neutral-200 to-transparent " +
    "dark:via-neutral-700/70";

  return (
    <div className="flex items-center gap-2 md:flex lg:hidden">
      {/* 햄버거 버튼 */}
      <button
        className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Icon icon={open ? "mdi:close" : "mdi:menu"} className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* 오버레이 */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 right-0 top-[64px] h-[calc(100vh-64px)] bg-black/40 backdrop-blur-sm z-30"
              onClick={() => setOpen(false)}
            />

            {/* 모바일 패널 */}
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="
                fixed top-[64px] left-0 right-0 mx-2 rounded-2xl
                border border-white/70 dark:border-white/15
                bg-white/95 dark:bg-[#050814]/95
                shadow-[0_18px_40px_-24px_rgba(15,23,42,0.65)]
                backdrop-blur-md
                px-4 pb-4 pt-3
                z-40
              "
            >
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/samples");
                }}
                className="w-full text-left py-2"
              >
                샘플
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/#pricing"); // ✅ 홈의 #pricing 섹션으로 이동
                }}
                className="w-full text-left py-2"
              >
                요금제
              </button>

              {/* 인사 / 이메일 */}
              {isAuthed && (
                <div className="text-xs text-primary font-medium mb-3 text-center truncate">
                  {email ? `${email}님, 안녕하세요` : "안녕하세요"}
                </div>
              )}

              {/* 상단 네비와 계정 영역 사이 구분선 */}
              <div className={dividerClass} />

              {/* 계정 관련 메뉴 (로그인 상태에서만) */}
              {isAuthed && (
                <>
                  <div className="flex flex-col text-sm">
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push("/my-summaries");
                      }}
                      className="w-full text-left py-2"
                    >
                      나의 맵
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push("/billing");
                      }}
                      className="w-full text-left py-2"
                    >
                      크레딧·결제
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push("/billing/history");
                      }}
                      className="w-full text-left py-2"
                    >
                      결제 내역
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push("/account");
                      }}
                      className="w-full text-left py-2"
                    >
                      계정 설정
                    </button>
                  </div>

                  {/* 계정 메뉴와 테마/언어 사이 구분선 */}
                  <div className={dividerClass} />
                </>
              )}

              {/* 테마 / 언어 영역 (ClientUserMenu와 동일 구조) */}
              <div className="px-1 py-1.5 space-y-2 text-xs text-muted-foreground">
                {/* 테마 */}
                <div className="flex items-center justify-between gap-2">
                  <span>테마</span>
                  <ThemeToggleText />
                </div>

                {/* 언어 */}
                <div className="flex items-center justify-between gap-2">
                  <span>언어</span>
                  <div>
                    <LanguageSelector />
                  </div>
                </div>
              </div>

              {/* 테마/언어와 인증 영역 사이 구분선 */}
              <div className={dividerClass} />

              {/* 하단: 로그인/회원가입 or 로그아웃 */}
              <div className="flex flex-row gap-2 pt-1">
                {!isAuthed ? (
                  <>
                    <Link
                      href="/login"
                      className="w-full text-primary border border-primary hover:bg-primary/10 font-medium 
                        rounded-lg text-sm px-4 py-2 text-center"
                      onClick={() => setOpen(false)}
                    >
                      로그인
                    </Link>
                    <Link
                      href="/signup"
                      className="w-full text-white bg-primary hover:bg-primary-hover font-medium 
                        rounded-lg text-sm px-4 py-2 text-center"
                      onClick={() => setOpen(false)}
                    >
                      회원가입
                    </Link>
                  </>
                ) : (
                  <form action="/auth/signout" method="POST" className="w-full">
                    <button
                      type="submit"
                      className="w-full text-white bg-primary hover:bg-primary-hover font-medium 
                        rounded-lg text-sm px-4 py-2 text-center"
                      onClick={() => setOpen(false)}
                    >
                      로그아웃
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
