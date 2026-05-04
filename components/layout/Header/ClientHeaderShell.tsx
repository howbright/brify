"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import ClientUserMenu from "./ClientUserMenu";
import ClientMobileUserMenu from "./ClientMobileMenu";
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  isAuthed: boolean;
  email: string | null;
};

export default function ClientHeaderShell({ isAuthed, email }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [isCreatingBlank, setIsCreatingBlank] = useState(false);
  const t = useTranslations("Header");
  const locale = useLocale();
  const router = useRouter();
  const desktopHeaderClass = "hidden min-[971px]:flex";
  const mobileHeaderClass = "hidden max-[970px]:flex";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const startBlankMap = async () => {
    if (isCreatingBlank) return;
    setIsCreatingBlank(true);
    try {
      const res = await fetch("/api/maps/blank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t("cta.blankMapDefaultTitle") }),
      });
      if (res.status === 401) {
        router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/video-to-map`)}`);
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.id) {
        throw new Error("blank_map_create_failed");
      }
      router.push(`/${locale}/maps/${json.id}`);
    } catch (error) {
      console.error("Failed to create blank map:", error);
    } finally {
      setIsCreatingBlank(false);
    }
  };


  // ✅ A 방법: pathname에 따른 분기 제거 (서버/클라 불일치 원천 차단)
  // homeLike 처리 없이 항상 동일한 배경 로직만 사용
  const headerClassName = [
    "fixed top-0 inset-x-0 z-40 transition-all",
    scrolled
      ? "bg-white/90 dark:bg-neutral-900/80 border-b border-slate-400 dark:border-white/20 shadow-sm"
      : [
          " border-b border-slate-300 dark:border-white/20",
          "bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.16),transparent_56%),radial-gradient(circle_at_100%_0%,rgba(129,140,248,0.18),transparent_56%),linear-gradient(90deg,rgba(255,255,255,0.98),rgba(239,246,255,0.98),rgba(255,255,255,0.98))]",
          "dark:bg-[#020617]",
          "dark:bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.45),transparent_60%),radial-gradient(circle_at_100%_0%,rgba(129,140,248,0.5),transparent_60%)]",
        ].join(" "),
  ].join(" ");

  return (
    <header className={headerClassName} role="banner">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex h-[64px] items-center justify-between min-[971px]:h-[64px]">
          {/* 좌측 로고 */}
          <Link href="/" className="flex min-w-0 items-center gap-2.5 min-[971px]:gap-3">
            <img
              src="/images/newlogo.png"
              alt="Brify"
              width={40}
              height={40}
              className="h-8 w-8 transition-transform hover:scale-[1.02] min-[971px]:h-10 min-[971px]:w-10"
              loading="eager"
              decoding="async"
            />
            <span className="truncate text-[20px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100 min-[971px]:text-[25px]">
              Brify
            </span>
          </Link>

          {/* 가운데 내비 — md 이상에서만 표시 */}
          <nav className={`${desktopHeaderClass} items-center gap-2`}>
            <Link
              href="/blog"
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 border border-slate-400 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              {t("nav.blog")}
            </Link>
            <Link
              href={{ pathname: "/", hash: "about" }}
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 border border-slate-400 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              {t("nav.about")}
            </Link>
            <Link
              href={{ pathname: "/", hash: "pricing" }}
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 border border-slate-400 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              {t("nav.pricing")}
            </Link>
            <Link
              href="/support"
              className="text-sm px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 border border-slate-400 dark:border-white/20 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              {t("nav.contactFeedback")}
            </Link>
          </nav>

          {/* 우측 액션 – 데스크탑 (md 이상) */}
          <div className={`${desktopHeaderClass} items-center gap-2`}>
            {!isAuthed && (
              <div className="flex items-center gap-0.5 text-sm">
                <LanguageSelector />
                <ThemeToggle />
              </div>
            )}

            {!isAuthed ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login?next=%2Fmaps"
                  className="
                    text-sm px-2 py-1.5 rounded-full
                    text-slate-700 hover:text-slate-900 hover:bg-slate-100
                    transition-colors
                    dark:text-slate-200 dark:hover:text-white dark:hover:bg-white/10
                  "
                >
                  {t("auth.login")}
                </Link>
                <Link
                  href="/signup?next=%2Fvideo-to-map"
                  className="
                    text-sm px-4 py-2 rounded-full
                    bg-blue-600 text-white
                    hover:bg-blue-700
                    hover:shadow-lg
                    transition-transform hover:scale-[1.03] active:scale-100
                    dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                  "
                >
                  {t("auth.signup")}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="
                        group inline-flex items-center gap-2
                        rounded-full px-4 py-2.5 text-sm font-semibold
                        bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500
                        text-white shadow-[0_10px_30px_rgba(37,99,235,0.40)]
                        hover:shadow-[0_14px_40px_rgba(79,70,229,0.60)]
                        transition-all duration-150
                        hover:-translate-y-0.5 hover:scale-[1.03] active:scale-100
                      "
                    >
                      <span
                        className="
                          inline-flex h-6 w-6 items-center justify-center
                          rounded-full border border-white/50
                          bg-white/15 shadow-sm
                        "
                      >
                        <Icon icon="lucide:plus" className="h-3.5 w-3.5" />
                      </span>
                      <span>{t("cta.newMap")}</span>
                      <Icon icon="lucide:chevron-down" className="h-4 w-4 opacity-90" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[280px] border border-slate-300 bg-white text-slate-900 shadow-xl dark:border-white/20 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        router.push(`/${locale}/video-to-map`);
                      }}
                      className="flex flex-col items-start gap-0.5 py-2.5"
                    >
                      <span className="text-sm font-semibold">{t("cta.fromTextTitle")}</span>
                      <span className="text-xs text-muted-foreground">{t("cta.fromTextDesc")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        void startBlankMap();
                      }}
                      disabled={isCreatingBlank}
                      className="flex flex-col items-start gap-0.5 py-2.5"
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          {t("cta.freeBadge")}
                        </span>
                        {isCreatingBlank ? t("cta.blankCreating") : t("cta.blankStartTitle")}
                      </span>
                      <span className="text-xs text-muted-foreground">{t("cta.blankStartDesc")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 나의 맵 – 세컨더리 텍스트 버튼 스타일 */}
                <Link
                  href="/maps"
                  className="
                    text-sm font-medium
                    px-2.5 py-1.5 rounded-lg
                    text-neutral-700 dark:text-neutral-200
                    hover:text-neutral-900 dark:hover:text-white
                    hover:bg-white/70 dark:hover:bg-white/5
                    border border-transparent hover:border-slate-400 dark:hover:border-white/20
                    transition-colors
                  "
                >
                  {t("cta.myMaps")}
                </Link>

                <ClientUserMenu email={email} />
              </div>
            )}
          </div>

          {/* 모바일 – 새 구조맵 버튼 + 모바일 메뉴 (md 미만) */}
          <div className={`${mobileHeaderClass} shrink-0 items-center gap-1.5`}>
            {!isAuthed && <LanguageSelector compact />}
            {!isAuthed && (
              <Link
                href="/signup?next=%2Fvideo-to-map"
                className="
                  inline-flex h-8 shrink-0 items-center rounded-xl
                  bg-blue-600 px-3 text-[12px] font-semibold text-white
                  shadow-[0_8px_22px_rgba(37,99,235,0.24)]
                  transition-colors hover:bg-blue-700
                  dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                "
              >
                {t("auth.signup")}
              </Link>
            )}

            {isAuthed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="
                      inline-flex h-8 shrink-0 items-center gap-1.5
                      rounded-xl px-3 text-[12px] font-semibold
                      bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500
                      text-white
                      shadow-[0_8px_22px_rgba(37,99,235,0.28)]
                      hover:shadow-[0_10px_28px_rgba(79,70,229,0.42)]
                      transition-all duration-150
                      hover:-translate-y-0.5 active:translate-y-0
                    "
                  >
                    <span
                      className="
                        inline-flex h-4.5 w-4.5 items-center justify-center
                        rounded-full border border-white/45
                        bg-white/15 shadow-sm
                      "
                    >
                      <Icon icon="lucide:plus" className="h-[10px] w-[10px]" />
                    </span>
                    <span>{t("cta.newMap")}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[260px] border border-slate-300 bg-white text-slate-900 shadow-xl dark:border-white/20 dark:bg-slate-900 dark:text-slate-100"
                >
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      router.push(`/${locale}/video-to-map`);
                    }}
                    className="flex flex-col items-start gap-0.5 py-2.5"
                  >
                    <span className="text-sm font-semibold">{t("cta.fromTextTitle")}</span>
                    <span className="text-xs text-muted-foreground">{t("cta.fromTextDesc")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      void startBlankMap();
                    }}
                    disabled={isCreatingBlank}
                    className="flex flex-col items-start gap-0.5 py-2.5"
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        {t("cta.freeBadge")}
                      </span>
                      {isCreatingBlank ? t("cta.blankCreating") : t("cta.blankStartTitle")}
                    </span>
                    <span className="text-xs text-muted-foreground">{t("cta.blankStartDesc")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <ClientMobileUserMenu isAuthed={isAuthed} email={email} />
          </div>
        </div>
      </div>
    </header>
  );
}
