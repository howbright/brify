"use client";

import LanguageSelector from "@/components/LanguageSelector";
import { useSession } from "@/components/SessionProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();
  const { session } = useSession();

  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<"basic" | "pro" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setEmail(session.user.email ?? null);

      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (!error && data) {
          setRole(data.role);
        }
      };

      fetchProfile();
    }
  }, [session, supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const navItems = [
    {
      href: "/summarize",
      label: "핵심정리하기",
      icon: "mdi:file-document-edit",
    },
    { href: "/my-summaries", label: "나의 정리함", icon: "mdi:folder" },
    { href: "/tags", label: "태그 보기", icon: "mdi:tag-multiple" },
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
                    <Icon
                      icon={item.icon}
                      className="inline-block mr-1 -mt-0.5 w-4 h-4"
                    />
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:border-primary hover:text-primary transition-colors">
                    <span className="hidden sm:inline truncate max-w-[120px]">
                      {email}
                    </span>
                    {role === "pro" ? (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        PRO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
                        BASIC
                      </span>
                    )}
                    <Icon icon="mdi:chevron-down" width={20} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push("/summarize")}>
                    핵심정리
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/my")}>
                    나의 정리함
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account")}>
                    계정 설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>로그아웃</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 햄버거 버튼 - sm 이상에서 항상 보이도록 */}
          <div className="flex items-center gap-2 md:flex lg:hidden">
            <button
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Icon icon="mdi:menu" className="w-6 h-6" />
            </button>
            <LanguageSelector />
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="lg:hidden mx-2 mt-2 px-4 pb-4 rounded-xl 
        bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 
        shadow-lg border border-border"
            >
              {session && (
                <div className="text-sm text-muted-foreground font-semibold mb-3 pt-3 text-center">
                  {`${email}님, 안녕하세요`}
                </div>
              )}

              <ul className="flex flex-col font-medium mb-4 divide-y divide-border">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block py-3 px-3 text-text hover:bg-primary/10 hover:text-primary 
                rounded-md text-center transition-colors text-[15px] font-semibold"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex flex-row gap-2 border-t border-border pt-3">
                {!session ? (
                  <>
                    <Link
                      href="/login"
                      className="w-full text-primary border border-primary hover:bg-primary/10 font-medium 
                rounded-lg text-sm px-4 py-2 text-center"
                    >
                      로그인
                    </Link>
                    <Link
                      href="/signup"
                      className="w-full text-white bg-primary hover:bg-primary-hover font-medium 
                rounded-lg text-sm px-4 py-2 text-center"
                    >
                      회원가입
                    </Link>
                  </>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
