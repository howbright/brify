"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function ReviewCard({
  quote,
  role,
  index,
}: {
  quote: string;
  role: string;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 22, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="rounded-[28px] border border-[#d7e0ea] bg-[#fbfcfe] px-6 py-6 shadow-[0_18px_42px_-30px_rgba(51,65,85,0.16)] transition-shadow duration-200 hover:shadow-[0_22px_52px_-28px_rgba(51,65,85,0.22)] dark:border-[#334155] dark:bg-[#172033] dark:shadow-[0_24px_52px_-30px_rgba(2,6,23,0.55)] dark:hover:shadow-[0_30px_60px_-28px_rgba(2,6,23,0.68)]"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f0fb] text-[#335c99] dark:bg-[#22314d] dark:text-[#d6e4ff]">
        <Icon icon="mdi:format-quote-open" className="h-5 w-5" />
      </div>

      <p className="mt-5 text-[18px] font-normal leading-8 tracking-tight text-[#172033] dark:text-[#f8fbff]">
        {quote}
      </p>

      <div className="mt-6 text-sm font-medium text-[#64748b] dark:text-[#b8c6da]">
        — {role}
      </div>
    </motion.article>
  );
}

export default function LandingTestimonialsSection() {
  const t = useTranslations("LandingTestimonialsSection");

  return (
    <section className="relative overflow-hidden border-y border-[#dbe4ef] bg-[#0c1525] px-6 py-14 dark:border-[#1f2b3d] md:px-10 md:py-18">
      <div
        aria-hidden
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage: "url('/images/testimonialbackground.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "scroll",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden dark:hidden md:block"
        style={{
          backgroundImage: "url('/images/testimonialbackground.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-white/48 dark:hidden"
      />
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#335c99] dark:text-[#b7cdf6]">
            {t("eyebrow")}
          </div>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#172033] dark:text-[#f8fafc] md:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <ReviewCard
            quote={t("items.one.quote")}
            role={t("items.one.role")}
            index={0}
          />
          <ReviewCard
            quote={t("items.two.quote")}
            role={t("items.two.role")}
            index={1}
          />
          <ReviewCard
            quote={t("items.three.quote")}
            role={t("items.three.role")}
            index={2}
          />
        </div>

        <div className="mt-8 flex justify-center md:mt-10">
          <Link
            href="/signup?next=%2Fvideo-to-map"
            className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#2563eb_0%,#0ea5e9_48%,#22c55e_100%)] px-6 py-3.5 text-[15px] font-extrabold tracking-[-0.01em] text-white shadow-[0_22px_48px_-22px_rgba(14,165,233,0.85)] transition-transform duration-200 hover:scale-[1.03] hover:brightness-[1.05] md:px-7 md:py-4 md:text-base"
          >
            <span>{t("cta")}</span>
            <Icon icon="mdi:arrow-right" className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
