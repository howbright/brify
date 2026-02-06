// components/layout/Header/ClientUserMenu.tsx
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
import { useTranslations } from "next-intl";

export default function ClientUserMenu({ email }: { email: string | null }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const t = useTranslations("Header");

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

  const dividerClass =
    "my-2 mx-1.5 h-px bg-gradient-to-r " +
    "from-transparent via-neutral-200 to-transparent " +
    "dark:via-neutral-700/70";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="
            inline-flex items-center justify-center
            rounded-full border border-transparent
            px-3 py-1.5 text-sm font-medium
            text-neutral-700 dark:text-neutral-200
            hover:border-blue-500/70 hover:bg-blue-50/80 hover:text-blue-700
            dark:hover:bg-white/5 dark:hover:text-blue-300
            transition-colors
          "
        >
          {t("userMenu.triggerLabel")}
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
              {t("userMenu.sectionTitle")}
            </div>
            <div className="px-3 pb-2 text-xs sm:text-sm text-neutral-900 dark:text-neutral-50 truncate">
              {email}
            </div>
            <DropdownMenuSeparator className={dividerClass} />
          </>
        )}

        <DropdownMenuItem
          className="text-sm"
          onSelect={(e) => {
            e.preventDefault();
            router.push("/maps");
          }}
        >
          <span>{t("cta.myMaps")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-sm"
          onSelect={(e) => {
            e.preventDefault();
            router.push("/billing");
          }}
        >
          <span>{t("userMenu.items.billing")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-sm"
          onSelect={(e) => {
            e.preventDefault();
            router.push("/billing/history");
          }}
        >
          <span>{t("userMenu.items.billingHistory")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-sm"
          onSelect={(e) => {
            e.preventDefault();
            router.push("/account");
          }}
        >
          <span>{t("userMenu.items.accountSettings")}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className={dividerClass} />

        {/* 테마 / 언어 */}
        <div className="px-2 py-1.5 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <span>{t("userMenu.theme")}</span>
            <ThemeToggleText />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span>{t("userMenu.language")}</span>
            <div>
              <LanguageSelector />
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className={dividerClass} />

        <DropdownMenuItem
          className="text-sm"
          onSelect={(e) => {
            e.preventDefault();
            handleSignOut();
          }}
        >
          <span>{t("userMenu.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
