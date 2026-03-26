"use client";

import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 💡 hydration mismatch 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTheme = resolvedTheme ?? theme;
  const isDark = currentTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="
        inline-flex h-8 w-8 items-center justify-center
        rounded-full text-neutral-700
        hover:bg-slate-100 hover:text-neutral-900
        active:translate-y-0
        transition-colors
        dark:text-neutral-100 dark:hover:bg-white/10
      "
    >
      <Icon
        icon={
          isDark
            ? "solar:sun-2-bold-duotone"      // 다크 모드일 때: 해 아이콘 (라이트로 전환)
            : "solar:moon-stars-bold-duotone" // 라이트 모드일 때: 달 아이콘 (다크로 전환)
        }
        className="text-[17px]"
      />
    </button>
  );
}
