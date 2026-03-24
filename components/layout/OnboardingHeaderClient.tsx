// components/layout/OnboardingHeaderClient.tsx
"use client";

import { Link } from "@/i18n/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function OnboardingHeaderClient({
  email,
}: {
  email: string | null;
}) {
  return (
    <header
      className="
        fixed top-0 inset-x-0 z-40 border-b border-black/5 dark:border-white/10
        bg-white/90 dark:bg-[#020617]/80
      "
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex h-[64px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-white/90 dark:bg-white/10 shadow-md flex items-center justify-center">
              <span className="font-black text-blue-600">B</span>
            </div>
            <span className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Brify
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <ThemeToggle />

            {email ? (
              <span className="hidden sm:inline text-xs text-neutral-500 dark:text-neutral-400">
                {email}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
