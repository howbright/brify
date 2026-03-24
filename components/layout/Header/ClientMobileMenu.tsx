// components/layout/Header/ClientMobileMenu.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggleText } from "@/components/ThemeToggleText";
import { useTranslations } from "next-intl";

export default function ClientMobileUserMenu({
  isAuthed,
  email,
}: {
  isAuthed: boolean;
  email: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("Header");

  const dividerClass =
    "my-2 mx-1.5 h-px bg-gradient-to-r " +
    "from-transparent via-slate-400 to-transparent " +
    "dark:via-white/20";

  return (
    <div className="flex items-center gap-2 md:flex lg:hidden">
      {/* 햄버거 버튼 */}
      <button
        className="inline-flex items-center rounded-lg border border-slate-400 p-2 text-sm text-gray-500 hover:bg-gray-100 dark:border-white/20 dark:text-gray-300 dark:hover:bg-gray-800"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Icon icon={open ? "mdi:close" : "mdi:menu"} className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* 🔹 오버레이 (다크모드에서 더 진하고 블러 강하게) */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="
                fixed left-0 right-0 top-[64px] h-[calc(100vh-64px)]
                bg-black/40 dark:bg-black/70
                backdrop-blur-[6px]
                z-30
              "
              onClick={() => setOpen(false)}
            />

            {/* 🔹 모바일 패널 (다크모드에서 살짝 더 밝고 유리 느낌) */}
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="
                fixed top-[64px] left-0 right-0 mx-2 rounded-2xl
                border border-slate-400 dark:border-white/20
                bg-white/95 dark:bg-[rgba(15,23,42,0.96)]
                shadow-[0_18px_40px_-24px_rgba(15,23,42,0.55)]
                dark:shadow-[0_22px_60px_-26px_rgba(15,23,42,0.95)]
                backdrop-blur-xl
                px-4 pb-4 pt-3
                z-40
              "
            >
              {/* 상단 내비게이션 항목 */}
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/demo");
                }}
                className="w-full text-left py-2 text-sm"
              >
                {t("nav.samples")}
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/#about");
                }}
                className="w-full text-left py-2 text-sm"
              >
                {t("nav.about")}
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/#pricing");
                }}
                className="w-full text-left py-2 text-sm"
              >
                {t("nav.pricing")}
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/support");
                }}
                className="w-full text-left py-2 text-sm"
              >
                {t("nav.contactFeedback")}
              </button>

              {/* 인사 / 이메일 */}
              {isAuthed && (
                <div className="mt-1 text-xs text-primary font-medium mb-3 text-center truncate">
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
                        router.push("/maps");
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

                  <div className={dividerClass} />
                </>
              )}

              {/* 테마 / 언어 영역 */}
              <div className="flex flex-col gap-2 px-1 py-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between gap-2">
                  <span>{t("userMenu.theme")}</span>
                  <ThemeToggleText />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span>{t("userMenu.language")}</span>
                  <div>
                    <LanguageSelector />
                  </div>
                </div>
              </div>

              <div className={dividerClass} />

              {/* 하단: 로그인/회원가입 or 로그아웃 */}
              <div className="flex flex-row gap-2 pt-1">
                {!isAuthed ? (
                  <>
                    <Link
                      href="/login"
                      className="w-full text-primary border border-slate-400 hover:bg-primary/10 font-medium 
                        rounded-lg text-sm px-4 py-2 text-center"
                      onClick={() => setOpen(false)}
                    >
                      {t("auth.login")}
                    </Link>
                    <Link
                      href="/login"
                      className="w-full text-white bg-primary hover:bg-primary-hover font-medium 
                        rounded-lg text-sm px-4 py-2 text-center"
                      onClick={() => setOpen(false)}
                    >
                      {t("auth.signup")}
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
                      {t("userMenu.logout")}
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
