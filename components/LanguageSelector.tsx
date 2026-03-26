"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

const locales = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
];

export default function LanguageSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const current = locales.find((l) => l.code === currentLocale);
  const localeCodes = locales.map((l) => l.code).join("|");

  const handleLocaleChange = (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;

    const pathWithoutLocale = pathname.replace(
      new RegExp(`^/(${localeCodes})`),
      ""
    );
    const newPath = `/${locale}${pathWithoutLocale || "/"}`;

    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/8 dark:hover:text-white">
          <Icon icon="ic:baseline-language" className="text-base opacity-80" />
          {current?.label || currentLocale}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="
  w-40 rounded-xl border border-slate-400
  bg-white/95 shadow-lg
  dark:border-white/20 dark:bg-slate-900/95
"
      >
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLocaleChange(locale.code)}
            className="cursor-pointer"
          >
            {locale.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
