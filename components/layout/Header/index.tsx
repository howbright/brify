"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { Link } from "@/i18n/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import Image from "next/image";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();
  const { session, isLoading } = useSession();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"basic" | "pro" | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (data) {
          setUserRole(data.role);
        }
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  return (
    <header>
      <nav
        id="mainNavbar"
        className="bg-white dark:bg-transparent py-2.5 fixed w-full z-40 top-0 border-b border-gray-300 dark:border-gray-700"
      >
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Brify Logo"
              className="h-8"
              width={100}
              height={100}
            />
          </Link>

          <div className="flex items-center lg:order-2 gap-2">
            <LanguageSelector />

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
                  className="text-white bg-primary hover:bg-primary-dark font-medium rounded-lg text-sm px-4 py-2"
                >
                  회원가입
                </Link>
              </>
            )}

            {session && userEmail && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{userEmail}</span>
                  {userRole && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        userRole === "pro"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          : "bg-gray-300 text-gray-800"
                      }`}
                    >
                      {userRole === "pro" ? "PRO" : "BASIC"}
                    </span>
                  )}
                  <Icon icon="mdi:chevron-down" width={20} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push("/summarize")}>
                    ✏️ 나의 핵심정리
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account")}>
                    ⚙️ 계정 설정
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.refresh();
                    }}
                  >
                    🚪 로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="hidden lg:flex lg:order-1 mt-2 lg:mt-0">
            <ul className="flex space-x-6 font-medium">
              <li>
                <Link
                  href="/"
                  className="text-gray-900 dark:text-white hover:text-primary"
                >
                  홈
                </Link>
              </li>
              <li>
                <Link
                  href="/summarize"
                  className="text-gray-900 dark:text-white hover:text-primary"
                >
                  핵심정리하기
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-gray-900 dark:text-white hover:text-primary"
                >
                  나의핵심정리
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-gray-900 dark:text-white hover:text-primary"
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
