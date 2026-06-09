"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";

type AppShellProps = {
  children: ReactNode;
  locale: string;
  email?: string | null;
};

function route(locale: string, href = "") {
  if (!href) return `/${locale}`;
  return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}

function getHomeLabel(locale: string) {
  if (locale === "ko") return "홈";
  if (locale === "fr") return "Accueil";
  return "Home";
}

export default function AppShell({ children, locale, email }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tNav = useTranslations("Header.nav");
  const tCta = useTranslations("Header.cta");
  const tUser = useTranslations("Header.userMenu");
  const [isCreatingBlank, setIsCreatingBlank] = useState(false);

  const safeLocale = locale === "ko" || locale === "en" || locale === "fr" ? locale : "ko";

  const startBlankMap = async () => {
    if (isCreatingBlank) return;
    setIsCreatingBlank(true);
    try {
      const response = await fetch("/api/maps/blank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: tCta("blankMapDefaultTitle") }),
      });
      const json = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push(route(safeLocale, "/login"));
        return;
      }
      if (!response.ok || typeof json?.id !== "string") {
        throw new Error("blank_map_create_failed");
      }
      router.push(route(safeLocale, `/maps/${json.id}`));
    } catch (error) {
      console.error("[AppShell] failed to create blank map", error);
    } finally {
      setIsCreatingBlank(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch(`/auth/signout?locale=${safeLocale}`, {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      router.replace(route(safeLocale));
      router.refresh();
    }
  };

  const publicNavItems = [
    { label: getHomeLabel(safeLocale), href: route(safeLocale), icon: "lucide:home" },
    { label: tNav("features"), href: route(safeLocale, "/features"), icon: "lucide:list-checks" },
    { label: tNav("blog"), href: route(safeLocale, "/blog"), icon: "lucide:newspaper" },
    { label: tNav("pricing"), href: route(safeLocale, "/pricing"), icon: "lucide:badge-dollar-sign" },
    { label: tNav("contactFeedback"), href: route(safeLocale, "/support"), icon: "lucide:message-circle" },
  ];

  const authedNavItems = [
    { label: tUser("items.myMaps"), href: route(safeLocale, "/maps"), icon: "lucide:folder-open" },
    { label: tUser("items.billing"), href: route(safeLocale, "/billing"), icon: "lucide:wallet" },
    { label: tUser("items.billingHistory"), href: route(safeLocale, "/billing/history"), icon: "lucide:receipt" },
  ];

  const getNavClassName = (href: string) => {
    const active =
      pathname === href ||
      (href !== route(safeLocale) && pathname?.startsWith(`${href}/`));
    return [
      "flex h-10 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition",
      active
        ? "bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white",
    ].join(" ");
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950 dark:bg-[#05070d] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(740px_260px_at_18%_8%,rgba(14,165,233,0.18),transparent_72%),radial-gradient(620px_280px_at_82%_4%,rgba(245,158,11,0.13),transparent_70%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,248,251,0))] dark:bg-[radial-gradient(760px_280px_at_18%_8%,rgba(34,211,238,0.2),transparent_72%),radial-gradient(620px_280px_at_82%_4%,rgba(251,191,36,0.12),transparent_70%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(5,7,13,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:28px_28px] opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_70%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] dark:opacity-45" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-slate-200 bg-white/86 px-3 py-4 shadow-[16px_0_60px_-48px_rgba(15,23,42,0.7)] backdrop-blur-xl lg:flex dark:border-white/10 dark:bg-[#080d16]/88">
        <a
          href={route(safeLocale)}
          className="mb-4 flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-100 dark:hover:bg-white/8"
        >
          <Image
            src="/images/newlogo.png"
            alt="Brify"
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <span className="text-[21px] font-black tracking-normal text-slate-950 dark:text-white">
            Brify
          </span>
        </a>

        <div className="mb-3 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => router.push(route(safeLocale))}
            className="flex h-11 items-center gap-3 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
          >
            <Icon icon="lucide:plus" className="h-4 w-4" />
            {tCta("newMap")}
          </button>
          <button
            type="button"
            onClick={() => void startBlankMap()}
            disabled={isCreatingBlank}
            className="flex h-10 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-55 dark:text-white/62 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <Icon icon="lucide:file-plus-2" className="h-4 w-4" />
            {isCreatingBlank ? tCta("blankCreating") : tCta("blankStartTitle")}
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {publicNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={getNavClassName(item.href)}
            >
              <Icon icon={item.icon} className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
          <div className="mb-2 px-3 text-[11px] font-black uppercase tracking-normal text-slate-400 dark:text-white/32">
            {tUser("sectionTitle")}
          </div>
          <div className="flex flex-col gap-1">
            {authedNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={getNavClassName(item.href)}
              >
                <Icon icon={item.icon} className="h-4 w-4" />
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200 pt-3 dark:border-white/10">
          {email ? (
            <div className="mb-2 truncate px-3 text-xs font-semibold text-slate-500 dark:text-white/45">
              {email}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2 px-1">
            <LanguageSelector compact />
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="mt-2 flex h-10 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/50 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <Icon icon="lucide:log-out" className="h-4 w-4" />
            {tUser("logout")}
          </button>
        </div>
      </aside>

      <div className="relative flex w-full flex-col px-4 pb-16 pt-4 sm:px-6 lg:ml-[264px] lg:w-[calc(100%-264px)] lg:px-8">
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/86 px-3 py-2 shadow-sm backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#0d1422]/88">
          <a href={route(safeLocale)} className="flex items-center gap-2">
            <Image
              src="/images/newlogo.png"
              alt="Brify"
              width={30}
              height={30}
              className="h-7 w-7"
            />
            <span className="text-lg font-black text-slate-950 dark:text-white">Brify</span>
          </a>
          <div className="flex items-center gap-1">
            <LanguageSelector compact />
            <ThemeToggle />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
