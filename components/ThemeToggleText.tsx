// components/ThemeToggleText.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  className?: string;
};

export function ThemeToggleText({ className = "" }: Props) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("ThemeToggle");

  // hydration mismatch 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTheme = resolvedTheme ?? theme;
  const isDark = currentTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const ariaLabel = isDark
    ? t("aria.toLight") // 다크 → 라이트로 전환
    : t("aria.toDark"); // 라이트 → 다크로 전환

  const label = isDark ? t("label.dark") : t("label.light");

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={ariaLabel}
      className={`
        inline-flex items-center justify-center
        px-3 py-1.5 rounded-full
        border border-border text-xs font-medium
        bg-white/80 text-neutral-700
        shadow-sm hover:bg-neutral-100 hover:-translate-y-0.5 hover:shadow-md
        active:translate-y-0
        transition-all
        dark:bg-white/10 dark:text-neutral-100
        ${className}
      `}
    >
      {label}
    </button>
  );
}
