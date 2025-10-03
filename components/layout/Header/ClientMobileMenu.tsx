// components/layout/Header/ClientMobileMenu.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import LanguageSelector from "@/components/LanguageSelector";

type NavItem = { href: string; label: string };
export default function ClientMobileMenu({
  isAuthed,
  email,
  navItems,
}: {
  isAuthed: boolean;
  email: string | null;
  navItems: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 md:flex lg:hidden">
      {/* 햄버거 버튼 */}
      <button
        className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Icon icon={open ? "mdi:close" : "mdi:menu"} className="w-6 h-6" />
      </button>
      <LanguageSelector />

      <AnimatePresence>
        {open && (
          <>
            {/* 🔴 오버레이 */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 right-0 top-[64px] h-[calc(100vh-64px)] bg-black/40 backdrop-blur-sm z-30"
              onClick={() => setOpen(false)}
            />
            {/* 🟢 모바일 패널 */}
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed top-[64px] left-0 right-0 mx-2 rounded-xl 
                bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 
                shadow-lg border border-border z-40 px-4 pb-4"
            >
              {isAuthed && (
                <div className="text-sm text-primary font-semibold mb-3 pt-3 text-center">
                  {`${email ?? ""}님, 안녕하세요`}
                </div>
              )}

              <ul className="flex flex-col font-medium mb-4 divide-y divide-border">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push(item.href);
                      }}
                      className="w-full block py-3 px-3 text-text hover:bg-primary/10 hover:text-primary 
                        rounded-md text-center transition-colors text-[15px] font-semibold"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex flex-row gap-2 border-t border-border pt-3">
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
                  // 필요하면 여기에도 로그아웃 폼을 넣을 수 있음
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
