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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();
  const { session } = useSession();

  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<"basic" | "pro" | null>(null);

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

  return (
    <header>
      <nav
        id="mainNavbar"
        className="bg-white dark:bg-background/50 backdrop-blur-md py-2.5 fixed w-full z-40 top-0 start-0 border-b border-border"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center px-4">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Brify Logo"
              className="h-8"
              width={100}
              height={100}
            />
          </Link>

          {/* 우측 메뉴 */}
          <div className="flex items-center space-x-2 lg:order-2">
            <LanguageSelector />

            {!session ? (
              <>
                <Link
                  href="/login"
                  className="text-text dark:text-white hover:text-primary border border-border hover:border-primary font-medium rounded-lg text-sm px-4 py-2"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="text-white bg-primary hover:bg-primary-hover font-medium rounded-lg text-sm px-4 py-2"
                >
                  회원가입
                </Link>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:border-primary hover:text-primary transition-colors">
                    <span className="hidden sm:inline truncate max-w-[120px]">{email}</span>
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
                  <DropdownMenuItem onClick={() => router.push("/summarize")}>핵심정리하기</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/my")}>나의 핵심정리</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account")}>계정 설정</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>로그아웃</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 좌측 메뉴 */}
          <div className="hidden lg:flex items-center lg:w-auto lg:order-1 mt-2 lg:mt-0">
            <ul className="flex flex-col rounded-lg font-medium lg:flex-row lg:gap-6 xl:gap-8">
              {[
                { href: "/", label: "홈" },
                { href: "/summarize", label: "핵심정리하기" },
                { href: "/my", label: "나의 핵심정리" },
                { href: "/tags", label: "태그" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block py-2 px-4 text-text dark:text-white border-b border-muted hover:bg-muted/50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:px-2 xl:px-4 dark:hover:bg-muted/10 lg:dark:hover:bg-transparent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}