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
        <button className="flex items-center gap-1 rounded-md border border-slate-400 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 dark:border-white/20 dark:text-gray-200 dark:hover:bg-gray-800">
          <Icon icon="ic:baseline-language" className="text-lg" />
          {current?.label || currentLocale}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="
  w-40 rounded-xl border border-slate-400
  bg-white/95 shadow-lg backdrop-blur-md
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
