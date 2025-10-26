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
      // 쿠키가 정리된 뒤 RSC 스냅샷 갱신
      router.refresh();
      // 원한다면 홈으로 보내기:
      // router.replace("/");
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
      <DropdownMenuContent align="end" className="w-48">
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
        <DropdownMenuItem
          // Radix는 onClick보다 onSelect가 확실합니다.
          onSelect={(e) => {
            e.preventDefault(); // 드롭다운 기본 처리와 충돌 방지
            handleSignOut();
          }}
        >
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
