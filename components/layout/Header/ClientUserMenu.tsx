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
        <button
          className="
            flex items-center gap-2
            px-3 py-1.5
            rounded-full border border-border
            bg-white/80 dark:bg-white/5
            text-xs sm:text-sm font-medium
            text-neutral-800 dark:text-neutral-100
            hover:border-primary hover:text-primary
            hover:bg-white
            dark:hover:bg-white/10
            transition-colors
          "
        >
          <span className="tracking-tight">내 계정</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="
          w-[17rem] rounded-2xl
          border border-white/70 dark:border-white/20
          bg-white/95 dark:bg-[rgba(15,23,42,0.98)]
          shadow-[0_18px_40px_-18px_rgba(15,23,42,0.9)]
          backdrop-blur-xl
          p-1.5
        "
      >
        {/* 상단 계정 정보 */}
        {mounted && email && (
          <>
            <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
              로그인 계정
            </div>
            <div className="px-3 pb-2 text-xs sm:text-sm text-neutral-900 dark:text-neutral-50 truncate">
              {email}
            </div>
            <DropdownMenuSeparator className={dividerClass} />
          </>
        )}

        {/* 메인 메뉴들 */}
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
