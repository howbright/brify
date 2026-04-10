"use client";

import { createClient } from "@/utils/supabase/client";
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

type Props = {
  compact?: boolean;
};

export default function LanguageSelector({ compact = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const supabase = createClient();
  const current = locales.find((l) => l.code === currentLocale);
  const localeCodes = locales.map((l) => l.code).join("|");

  const handleLocaleChange = async (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.auth.updateUser({
          data: {
            ...(user.user_metadata ?? {}),
            language: locale,
          },
        });
      }
    } catch {
      // 언어 저장 실패가 라우팅을 막을 필요는 없으므로 무시
    }

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
        <button
          className={[
            "inline-flex items-center rounded-full font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/8 dark:hover:text-white",
            compact ? "gap-1 px-2 py-1 text-xs" : "gap-1.5 px-2 py-1 text-sm",
          ].join(" ")}
        >
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
