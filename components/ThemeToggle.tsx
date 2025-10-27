"use client";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <button
      className="px-3 py-2 rounded-full border border-border"
      onClick={() => setTheme((resolvedTheme ?? theme) === "dark" ? "light" : "dark")}
      type="button"
    >
      {/* 둘 다 렌더하고 CSS로 토글 */}
      <span className="dark:hidden">다크</span>
      <span className="hidden dark:inline">라이트</span>
    </button>
  );
}
