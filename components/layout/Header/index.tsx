"use client";

import LanguageSelector from "@/components/LanguageSelector";
import { useSession } from "@/components/SessionProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
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
  const { session, isLoading } = useSession();

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
        data-sticky="false"
        className="bg-white dark:bg-transparent py-2.5 fixed w-full z-40 top-0 start-0 border-b border-gray-300 dark:border-gray-700 data-[sticky=true]:bg-white data-[sticky=true]:dark:bg-gray-800"
      >
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl px-4">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Brify Logo"
              className="h-8"
              width={100}
              height={100}
            />
          </Link>

          {/* 우측 메뉴 */}
          <div className="flex items-center space-x-2 lg:order-2">
            <div className="order-last sm:order-none">
              <LanguageSelector />
            </div>

            {!session && (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-white hover:text-primary border border-gray-300 dark:border-gray-600 hover:border-primary font-medium rounded-lg text-sm px-4 py-2"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="text-white bg-primary hover:bg-primary-dark focus:ring-primary font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary dark:hover:bg-primary-dark focus:outline-none dark:focus:ring-primary"
                >
                  회원가입
                </Link>
              </>
            )}

            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-sm hover:border-primary hover:text-primary transition-colors">
                    <span className="hidden sm:inline truncate max-w-[120px]">{email}</span>
                    {role === "pro" ? (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        PRO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white">
                        BASIC
                      </span>
                    )}
                    <Icon icon="mdi:chevron-down" width={20} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push("/summarize")}>
                    핵심정리하기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/my")}>
                    나의 핵심정리
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account")}>
                    계정 설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 좌측 메뉴 */}
          <div className="hidden lg:flex items-center w-full lg:w-auto lg:order-1 bg-white dark:bg-gray-800 lg:bg-transparent lg:dark:bg-transparent mt-2 lg:mt-0">
            <ul className="flex flex-col rounded-lg font-medium lg:flex-row lg:space-x-8">
              <li>
                <Link
                  href="/"
                  className="block py-2 px-4 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  홈
                </Link>
              </li>
              <li>
                <Link
                  href="/summarize"
                  className="block py-2 px-4 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  핵심정리하기
                </Link>
              </li>
              <li>
                <Link
                  href="/my"
                  className="block py-2 px-4 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  나의 핵심정리
                </Link>
              </li>
              <li>
                <Link
                  href="/tags"
                  className="block py-2 px-4 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  태그
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
