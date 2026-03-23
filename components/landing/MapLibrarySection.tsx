"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

function SectionCard({
  title,
  description,
  children,
  className,
  visualClassName,
  index,
  featured = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  visualClassName?: string;
  index?: number;
  featured?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 22, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.42, delay: (index ?? 0) * 0.06, ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.018 }}
      className={`group relative flex h-full flex-col rounded-[28px] border p-5 transition-all duration-300 ${
        featured
          ? "border-blue-400 bg-[linear-gradient(180deg,#ffffff_0%,#e8f1ff_100%)] shadow-[0_26px_68px_-30px_rgba(37,99,235,0.34)] dark:border-blue-400/35 dark:bg-[linear-gradient(180deg,rgba(37,99,235,0.16),rgba(15,23,42,0.96))] dark:shadow-[0_24px_64px_-30px_rgba(59,130,246,0.34)]"
          : "border-slate-400 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_20px_54px_-32px_rgba(15,23,42,0.24)] dark:border-white/18 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(15,23,42,0.94))] dark:shadow-[0_20px_54px_-32px_rgba(56,189,248,0.2)] hover:border-blue-400 hover:bg-[linear-gradient(180deg,#ffffff_0%,#eef5ff_100%)] hover:shadow-[0_26px_64px_-30px_rgba(37,99,235,0.28)] dark:hover:border-blue-400/34 dark:hover:bg-[linear-gradient(180deg,rgba(37,99,235,0.12),rgba(15,23,42,0.95))] dark:hover:shadow-[0_24px_60px_-30px_rgba(59,130,246,0.28)]"
      } ${className ?? ""}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-6 top-0 h-16 rounded-t-[24px] ${
          featured
            ? "bg-[radial-gradient(60%_100%_at_50%_0%,rgba(59,130,246,0.18),transparent_76%)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgba(96,165,250,0.18),transparent_78%)]"
            : "opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(59,130,246,0.12),transparent_76%)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgba(96,165,250,0.14),transparent_78%)]"
        }`}
      />
      <div className={`mb-5 flex min-h-[148px] items-center ${visualClassName ?? ""}`}>
        {children}
      </div>
      <div className="mt-auto">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
    </motion.article>
  );
}

function MapChip({ className }: { className?: string }) {
  return (
    <div
      className={`flex h-10 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/10 ${className ?? ""}`}
    >
      <Icon
        icon="mdi:graph-outline"
        className="h-5 w-5 text-blue-600 dark:text-blue-300"
      />
    </div>
  );
}

function TagVisual() {
  return (
    <div className="mx-auto w-fit max-w-full rounded-[24px] bg-slate-100 p-4 dark:bg-white/[0.05]">
      <div className="flex flex-col items-start gap-2">
        <div className="rounded-2xl bg-blue-50 p-2 dark:bg-blue-500/10">
          <div className="flex gap-1.5">
            <MapChip />
            <MapChip />
          </div>
        </div>
        <div className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">
          #keto
        </div>
      </div>
      <div className="mt-3 flex flex-col items-start gap-2">
        <div className="rounded-2xl bg-indigo-50 p-2 dark:bg-indigo-500/10">
          <div className="flex gap-1.5">
            <MapChip />
            <MapChip />
            <MapChip />
          </div>
        </div>
        <div className="rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white">
          #research
        </div>
      </div>
    </div>
  );
}

function MergeVisual() {
  return (
    <div className="w-full rounded-[24px] bg-blue-50/80 p-4 dark:bg-blue-500/[0.08]">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <MapChip />
        <Icon icon="mdi:plus" className="h-4 w-4 shrink-0 text-slate-400" />
        <MapChip />
        <Icon icon="mdi:equal" className="h-4 w-4 shrink-0 text-slate-400" />
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2.5 shadow-sm dark:border-blue-400/20 dark:bg-blue-500/10">
          <Icon icon="mdi:graph-outline" className="h-7 w-7 text-blue-700 dark:text-blue-300" />
        </div>
      </div>
    </div>
  );
}

function EditVisual() {
  return (
    <div className="w-full rounded-[24px] bg-slate-100 p-4 dark:bg-white/[0.05]">
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-white/[0.05]">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex max-w-full rounded-full bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">
            Node Title
          </div>
          <div className="rounded-full bg-slate-900 p-2 text-white dark:bg-white dark:text-slate-900">
            <Icon icon="mdi:pencil-outline" className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 w-16 rounded-full bg-blue-500/85" />
          <div className="h-2 w-10 rounded-full bg-slate-200 dark:bg-white/15" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <div className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
            Rename
          </div>
          <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
            Move
          </div>
          <div className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
            Add
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadVisual() {
  return (
    <div className="w-full rounded-[24px] bg-slate-100 p-4 dark:bg-white/[0.05]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-white/15" />
            <div className="h-3 w-28 rounded-full border border-amber-700/70 bg-amber-300 shadow-[0_0_0_3px_rgba(253,224,71,0.24)]" />
            <div className="h-3 w-20 rounded-full bg-slate-200 dark:bg-white/15" />
            <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-white/15" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="rounded-full bg-amber-400 p-2 text-slate-900 shadow-sm">
              <Icon icon="mdi:marker" className="h-4 w-4" />
            </div>
            <div className="rounded-full bg-red-500 p-2 text-white shadow-sm">
              <Icon icon="mdi:note-text-outline" className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareVisual() {
  return (
    <div className="mx-auto w-fit max-w-full rounded-[24px] bg-slate-100 p-4 dark:bg-white/[0.05]">
      <div className="flex items-center justify-center gap-4">
        <MapChip className="h-14 w-20" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
            <Icon icon="mdi:link-variant" className="h-4 w-4" />
            Link
          </div>
          <div className="flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-xs font-bold text-white">
            <Icon icon="mdi:download" className="h-4 w-4" />
            PNG
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MapLibrarySection() {
  const t = useTranslations("MapLibrarySection");

  return (
    <section className="relative bg-[#dfeafc] px-6 py-24 dark:bg-[#10203a] md:px-10">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-blue-200 bg-[linear-gradient(180deg,#eff5ff_0%,#f7faff_100%)] p-6 shadow-[0_24px_80px_-40px_rgba(37,99,235,0.24)] dark:border-blue-400/20 dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_100%)] dark:shadow-[0_24px_80px_-40px_rgba(59,130,246,0.24)] md:p-8">
        <div className="max-w-2xl">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
            {t("eyebrow")}
          </div>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900 dark:text-white md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-base font-semibold leading-7 text-slate-600 dark:text-slate-300">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <SectionCard
            title={t("cards.tags.title")}
            description={t("cards.tags.description")}
            visualClassName="md:min-h-[172px] xl:min-h-[148px]"
            index={0}
          >
            <TagVisual />
          </SectionCard>
          <SectionCard
            title={t("cards.merge.title")}
            description={t("cards.merge.description")}
            index={1}
            featured
          >
            <MergeVisual />
          </SectionCard>
          <SectionCard
            title={t("cards.edit.title")}
            description={t("cards.edit.description")}
            index={2}
          >
            <EditVisual />
          </SectionCard>
          <SectionCard
            title={t("cards.read.title")}
            description={t("cards.read.description")}
            index={3}
          >
            <ReadVisual />
          </SectionCard>
          <SectionCard
            title={t("cards.share.title")}
            description={t("cards.share.description")}
            index={4}
          >
            <ShareVisual />
          </SectionCard>
        </div>
      </div>
    </section>
  );
}
