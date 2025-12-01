// components/layout/Header/ClientUserMenu.tsx (Client Component)
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggleText } from "@/components/ThemeToggleText";

export default function ClientUserMenu({ email }: { email: string | null }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  async function handleSignOut() {
    try {
      await fetch("/auth/signout", {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      router.refresh();
    }
  }

  // 공통 divider 스타일
  const dividerClass =
    "my-2 mx-1.5 h-px bg-gradient-to-r " +
    "from-transparent via-neutral-200 to-transparent " +
    "dark:via-neutral-700/70";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:border-primary hover:text-primary transition-colors">
          {mounted && email ? (
            <span className="hidden sm:inline truncate max-w-[140px]">
              {email}
            </span>
          ) : (
            <span className="hidden sm:inline truncate max-w-[140px]">
              계정
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="
          w-[17rem] rounded-2xl
          border border-white/70 dark:border-white/15
          bg-white/95 dark:bg-[#050814]/95
          shadow-[0_18px_40px_-24px_rgba(15,23,42,0.65)]
          backdrop-blur-md
          p-1.5
        "
      >
        {/* 상단 메인 메뉴들 */}
        <DropdownMenuItem
          className="text-sm"
          onSelect={(e) => {
            e.preventDefault();
            router.push("/my-summaries");
          }}
        >
          <span>나의 맵</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-sm"
          onSelect={(e) => {
            e.preventDefault();
            router.push("/billing");
          }}
        >
          <span>크레딧·결제</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-sm"
          onSelect={(e) => {
            e.preventDefault();
            router.push("/billing/history");
          }}
        >
          <span>결제 내역</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-sm"
          onSelect={(e) => {
            e.preventDefault();
            router.push("/account");
          }}
        >
          <span>계정 설정</span>
        </DropdownMenuItem>

        {/* --- 구분선 --- */}
        <DropdownMenuSeparator className={dividerClass} />

        {/* 테마 / 언어 영역 */}
        <div className="px-2 py-1.5 space-y-2 text-xs text-muted-foreground">
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

        {/* --- 구분선 --- */}
        <DropdownMenuSeparator className={dividerClass} />

        {/* 로그아웃 */}
        <DropdownMenuItem
          className="text-sm"
          onSelect={(e) => {
            e.preventDefault();
            handleSignOut();
          }}
        >
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
