// components/layout/Header/ClientUserMenu.tsx (Client Component)
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ⬇️ 추가
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ClientUserMenu({ email }: { email: string | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const router = useRouter();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:border-primary hover:text-primary transition-colors">
          {mounted && email ? (
            <span className="hidden sm:inline truncate max-w-[120px]">
              {email}
            </span>
          ) : (
            <span className="hidden sm:inline truncate max-w-[120px]">
              계정
            </span>
          )}
          <Icon icon="mdi:chevron-down" width={20} />
        </button>
      </DropdownMenuTrigger>

      {/* ⬇️ 살짝 넓혀줌 */}
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="
          w-64 rounded-2xl
          border border-white/70 dark:border-white/20
          bg-white/95 dark:bg-black/95
          shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]
          backdrop-blur-md
          p-1.5
        "
      >
        {/* 메인 메뉴 */}
        <DropdownMenuItem onClick={() => router.push("/summarize")}>
          핵심정리
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/my")}>
          나의 스크랩북
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account")}>
          계정 설정
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 🔥 테마 / 언어 영역 추가 */}
        <div className="px-2 py-1.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">테마</span>
            {/* 그대로 재사용 */}
            <ThemeToggle />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">언어</div>
            {/* 기존 LanguageSelector 그대로 */}
            <LanguageSelector />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* 로그아웃 */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleSignOut();
          }}
        >
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
