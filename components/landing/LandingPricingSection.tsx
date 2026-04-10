// components/landing/LandingPricingSection.tsx
"use client";

import PricingGrid, { Pack } from "@/components/pricing/PricingGrid";
import { getBillingCurrencyByLocale } from "@/app/lib/billing/catalog";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

type Props = {
  isAuthed: boolean;
  packs?: Pack[];
};

function RibbonText({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 1000 140"
      className="h-[74px] w-full overflow-visible sm:h-[54px]"
      aria-hidden="true"
    >
      <defs>
        <path id="ribbon-arc" d="M 90 94 Q 500 24 910 94" />
      </defs>
      <text
        fill="currentColor"
        fontWeight="800"
        letterSpacing="-0.02em"
        className={compact ? "text-[52px] sm:text-[40px]" : "text-[60px] sm:text-[46px]"}
      >
        <textPath href="#ribbon-arc" startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  );
}

export default function LandingPricingSection({ isAuthed, packs }: Props) {
  const t = useTranslations("LandingPricingSection");
  const locale = useLocale();
  const isKorean = locale === "ko";
  const isCompactRibbon = locale !== "ko";
  const [catalogPacks, setCatalogPacks] = useState<Pack[]>(packs ?? []);

  useEffect(() => {
    if (packs) {
      setCatalogPacks(packs);
      return;
    }

    let cancelled = false;
    const currency = getBillingCurrencyByLocale(locale);

    const loadCatalog = async () => {
      try {
        const res = await fetch(`/api/billing/catalog?currency=${currency}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          console.error("Failed to load billing catalog");
          return;
        }

        const data = (await res.json()) as {
          items: Array<{ id: string; credits: number; price: number; popular?: boolean; starter?: boolean }>;
        };

        if (cancelled) return;

        setCatalogPacks(
          (data.items ?? []).map((pack) => ({
            id: pack.id,
            credits: pack.credits,
            priceUSD: pack.price,
            popular: pack.popular,
            starter: pack.starter,
          }))
        );
      } catch (error) {
        console.error("Error while loading billing catalog:", error);
      }
    };

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [packs, locale]);

  const effectivePacks: Pack[] = useMemo(() => {
    return catalogPacks;
  }, [catalogPacks]);

  const signedInHref = `/${locale}/billing`;
  const signedOutHref = `/${locale}/login?next=${encodeURIComponent(
    `/${locale}/billing`
  )}`;

  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-b border-transparent bg-[#f6f9ff] dark:bg-[#071124]"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#edf4ff_0%,#dbeafe_42%,#eff6ff_100%)] dark:hidden"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(620px_320px_at_12%_16%,rgba(59,130,246,0.32),transparent_62%),radial-gradient(560px_280px_at_84%_18%,rgba(99,102,241,0.26),transparent_60%),radial-gradient(700px_340px_at_50%_100%,rgba(147,197,253,0.28),transparent_68%)] dark:hidden"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:26px_26px] opacity-70 dark:hidden"
      />

      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden dark:block bg-[linear-gradient(180deg,#091223_0%,#071124_40%,#050d1c_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden dark:block bg-[radial-gradient(520px_260px_at_16%_18%,rgba(59,130,246,0.18),transparent_62%),radial-gradient(560px_280px_at_82%_20%,rgba(99,102,241,0.18),transparent_62%),radial-gradient(620px_320px_at_50%_100%,rgba(14,165,233,0.10),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden dark:block bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:26px_26px] opacity-45"
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:py-18">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-text)]">
            {t("title")}
          </h2>
          <p className="mt-3 text-[15px] font-normal text-slate-700 dark:text-slate-300 md:text-[17px]">
            {t("subtitle")}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="mt-8 rounded-[32px] border border-slate-400 bg-white px-6 py-7 text-center shadow-[0_22px_60px_-34px_rgba(37,99,235,0.26)] dark:border-white/20 dark:bg-white/[0.08]"
        >
          <div className="flex justify-center">
            <div className="relative w-full max-w-[420px] md:max-w-[480px]">
              <Image
                src="/images/reborn.png?v=20260319-2318"
                alt=""
                width={1000}
                height={200}
                className="h-auto w-full"
                priority={false}
              />
              <div className="absolute inset-0 flex -translate-y-[4px] items-center justify-center px-5 text-center sm:-translate-y-[8px] sm:px-8">
                <span className="block w-full max-w-[96%] text-slate-900 sm:max-w-[88%]">
                  <RibbonText text={t("freeCreditsBadge")} compact={isCompactRibbon} />
                </span>
              </div>
            </div>
          </div>
          <div className="mt-5 text-[25px] font-extrabold leading-tight tracking-[-0.02em] text-slate-900 dark:text-white md:text-[36px]">
            {t("cards.main.title")}
          </div>
          <p className="mt-3 text-[15px] font-semibold leading-6 text-slate-700 dark:text-slate-200 md:text-base">
            {t("cards.main.description")}
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap sm:gap-2.5">
            <div className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-white/20 dark:bg-white/[0.08] dark:text-slate-200 sm:w-auto sm:rounded-full sm:px-4 sm:py-2">
              {t("cards.pay.title")}
            </div>
            <div className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-white/20 dark:bg-white/[0.08] dark:text-slate-200 sm:w-auto sm:rounded-full sm:px-4 sm:py-2">
              {t("cards.noSubscription.title")}
            </div>
          </div>
        </motion.div>

        {/* ✅ Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
          className="
            mt-6
            rounded-3xl
            bg-transparent
            shadow-none
          "
        >
          <div className="p-2 md:p-3">
            <PricingGrid
              packs={effectivePacks}
              isAuthed={isAuthed}
              signedInHref={signedInHref}
              signedOutHref={signedOutHref}
              variant="compact"
              showFooterNote={false}
              showReassurance={false}
              billingCurrency={isKorean ? "KRW" : "USD"}
            />
          </div>
        </motion.div>
      </div>

      {/* soft glow accents */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute -z-10 blur-3xl opacity-35
          left-[-10%] top-[40%] h-[360px] w-[360px]
          bg-[radial-gradient(180px_180px_at_center,rgba(59,130,246,0.28),transparent)]
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute -z-10 blur-3xl opacity-35
          right-[-6%] bottom-[10%] h-[300px] w-[300px]
          bg-[radial-gradient(150px_150px_at_center,rgba(99,102,241,0.28),transparent)]
        "
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-60px] hidden h-[120px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(96,165,250,0.16),transparent_72%)] dark:block"
      />
    </section>
  );
}
