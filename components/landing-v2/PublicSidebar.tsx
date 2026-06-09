"use client";

import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type PublicSidebarCopy = {
  create: string;
  newMap: string;
  blankMap: string;
  blankCreating: string;
  brandHome: string;
  navFeatures: string;
  navBlog: string;
  navPricing: string;
  navSupport: string;
  myMaps: string;
  billing: string;
  billingHistory: string;
  account: string;
  logout: string;
  login: string;
  signup: string;
};

type Props = {
  locale: string;
  isAuthed: boolean;
  email?: string | null;
  copy: PublicSidebarCopy;
};

function route(locale: string, href = "") {
  if (!href) return `/${locale}`;
  return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}

export default function PublicSidebar({ locale, isAuthed, email, copy }: Props) {
  const router = useRouter();
  const [isCreatingBlank, setIsCreatingBlank] = useState(false);
  const safeLocale = locale || "ko";
  const loginHref = route(safeLocale, "/login");
  const signupHref = route(safeLocale, "/signup");

  const publicNavItems = [
    { label: copy.brandHome, href: route(safeLocale), icon: "lucide:home" },
    { label: copy.navFeatures, href: route(safeLocale, "/features"), icon: "lucide:list-checks" },
    { label: copy.navBlog, href: route(safeLocale, "/blog"), icon: "lucide:newspaper" },
    { label: copy.navPricing, href: route(safeLocale, "/pricing"), icon: "lucide:badge-dollar-sign" },
    { label: copy.navSupport, href: route(safeLocale, "/support"), icon: "lucide:message-circle" },
  ];

  const authedNavItems = [
    { label: copy.myMaps, href: route(safeLocale, "/maps"), icon: "lucide:folder-open" },
    { label: copy.billing, href: route(safeLocale, "/billing"), icon: "lucide:wallet" },
    { label: copy.billingHistory, href: route(safeLocale, "/billing/history"), icon: "lucide:receipt" },
  ];

  const startBlankMap = async () => {
    if (isCreatingBlank) return;
    setIsCreatingBlank(true);
    try {
      const response = await fetch("/api/maps/blank", { method: "POST" });
      if (response.status === 401) {
        router.push(loginHref);
        return;
      }
      const json = await response.json().catch(() => ({}));
      if (!response.ok || typeof json?.id !== "string") {
        throw new Error("blank_map_create_failed");
      }
      router.push(route(safeLocale, `/maps/${json.id}`));
    } catch (blankError) {
      console.error("Failed to create blank map:", blankError);
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

  return (
    <>
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
          {isAuthed ? (
            <>
              <button
                type="button"
                onClick={() => router.push(route(safeLocale))}
                className="flex h-11 items-center gap-3 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                <Icon icon="lucide:plus" className="h-4 w-4" />
                {copy.newMap}
              </button>
              <button
                type="button"
                onClick={() => void startBlankMap()}
                disabled={isCreatingBlank}
                className="flex h-10 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-55 dark:text-white/62 dark:hover:bg-white/8 dark:hover:text-white"
              >
                <Icon icon="lucide:file-plus-2" className="h-4 w-4" />
                {isCreatingBlank ? copy.blankCreating : copy.blankMap}
              </button>
            </>
          ) : (
            <a
              href={signupHref}
              className="flex h-11 items-center gap-3 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              <Icon icon="lucide:plus" className="h-4 w-4" />
              {copy.create}
            </a>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {publicNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex h-10 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white"
            >
              <Icon icon={item.icon} className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </nav>

        {isAuthed ? (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
            <div className="mb-2 px-3 text-[11px] font-black uppercase tracking-normal text-slate-400 dark:text-white/32">
              {copy.account}
            </div>
            <div className="flex flex-col gap-1">
              {authedNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex h-10 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white"
                >
                  <Icon icon={item.icon} className="h-4 w-4" />
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-auto border-t border-slate-200 pt-3 dark:border-white/10">
          {isAuthed && email ? (
            <div className="mb-2 truncate px-3 text-xs font-semibold text-slate-500 dark:text-white/45">
              {email}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2 px-1">
            <LanguageSelector compact />
            <ThemeToggle />
          </div>
          {isAuthed ? (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="mt-2 flex h-10 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/50 dark:hover:bg-white/8 dark:hover:text-white"
            >
              <Icon icon="lucide:log-out" className="h-4 w-4" />
              {copy.logout}
            </button>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a
                href={loginHref}
                className="inline-flex h-10 items-center justify-center rounded-2xl text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/58 dark:hover:bg-white/8 dark:hover:text-white"
              >
                {copy.login}
              </a>
              <a
                href={signupHref}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
              >
                {copy.signup}
              </a>
            </div>
          )}
        </div>
      </aside>

      <div className="relative mb-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/86 px-3 py-2 shadow-sm backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#0d1422]/88">
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
          {isAuthed ? (
            <a
              href={route(safeLocale, "/maps")}
              className="inline-flex h-8 items-center rounded-xl px-2 text-xs font-black text-slate-600 dark:text-white/62"
            >
              {copy.myMaps}
            </a>
          ) : (
            <a
              href={signupHref}
              className="inline-flex h-8 items-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white dark:bg-cyan-400 dark:text-slate-950"
            >
              {copy.signup}
            </a>
          )}
        </div>
      </div>
    </>
  );
}
