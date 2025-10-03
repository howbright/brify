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

export default function ClientUserMenu({
  email,
  role,
}: {
  email: string | null;
  role: "basic" | "pro" | null;
}) {
  const router = useRouter();
  return (
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
          나의 스크랩북
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account")}>
          계정 설정
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action="/auth/signout" method="POST">
            <button type="submit">로그아웃</button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
