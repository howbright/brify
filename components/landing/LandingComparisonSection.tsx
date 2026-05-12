"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

type ComparisonCardProps = {
  badge: string;
  title: string;
  description: string;
  items: string[];
  limitations?: string[];
  accent: "slate" | "blue";
};

type ComparisonMatrixCell = {
  label: string;
  tone: "none" | "partial" | "brify";
};

type ComparisonMatrixRow = {
  feature: string;
  detail?: string;
  notebooklm: ComparisonMatrixCell;
  brify: ComparisonMatrixCell;
};

type ComparisonFootnote = {
  notebooklm: {
    label: string;
    text: string;
  };
  brify: {
    label: string;
    text: string;
  };
};

function ComparisonCard({
  badge,
  title,
  description,
  items,
  limitations = [],
  accent,
}: ComparisonCardProps) {
  const isBlue = accent === "blue";

  return (
    <article
      className={[
        "rounded-[28px] border p-6 md:p-7",
        isBlue
          ? "border-blue-200 bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_100%)] shadow-[0_24px_48px_-30px_rgba(37,99,235,0.28)] dark:border-blue-300/20 dark:bg-[linear-gradient(180deg,rgba(30,64,175,0.18),rgba(10,17,30,0.92))]"
          : "border-slate-200 bg-white/85 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/80",
      ].join(" ")}
    >
      <div
        className={[
          "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
          isBlue
            ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-950"
            : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/75",
        ].join(" ")}
      >
        {badge}
      </div>

      <h3 className="mt-4 text-xl font-bold leading-tight text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-[15px]">
        {description}
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex items-start gap-3">
            <Icon
              icon="mdi:check-circle"
              className={[
                "mt-0.5 h-4.5 w-4.5 shrink-0",
                isBlue ? "text-blue-600 dark:text-blue-300" : "text-slate-500 dark:text-slate-300",
              ].join(" ")}
            />
            <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200 md:text-[15px]">
              {item}
            </p>
          </div>
        ))}
      </div>

      {limitations.length > 0 ? (
        <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-white/10">
          <div className="flex flex-col gap-3">
            {limitations.map((item, index) => (
              <div key={`${title}-limitation-${index}`} className="flex items-start gap-3">
                <Icon
                  icon="mdi:close-circle"
                  className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rose-500 dark:text-rose-300"
                />
                <p className="text-sm font-medium leading-6 text-slate-600 dark:text-slate-300 md:text-[15px]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function StatusPill({ label, tone }: ComparisonMatrixCell) {
  if (tone === "brify") {
    return (
      <span
        aria-label={label}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200"
      >
        <Icon icon="mdi:check" className="h-5 w-5" />
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-2 text-xs font-semibold md:text-[13px]"
    >
      <span
        className={[
          "relative h-2.5 w-2.5 shrink-0 rounded-full",
          tone === "none"
            ? "border border-slate-300 bg-white dark:border-slate-500 dark:bg-transparent"
            : "overflow-hidden bg-amber-200 dark:bg-amber-200/40",
        ].join(" ")}
      >
        {tone === "partial" ? (
          <span className="absolute inset-y-0 right-0 w-1/2 bg-amber-500 dark:bg-amber-300" />
        ) : null}
      </span>
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
    </span>
  );
}

function MobileStatusBadge({ cell }: { cell: ComparisonMatrixCell }) {
  if (cell.tone === "brify") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-300/30 dark:bg-blue-500/12 dark:text-blue-200">
        <Icon icon="mdi:check" className="h-3.5 w-3.5" />
        {cell.label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <span
        className={[
          "relative h-2.5 w-2.5 shrink-0 rounded-full",
          cell.tone === "none"
            ? "border border-slate-300 bg-white dark:border-slate-500 dark:bg-transparent"
            : "overflow-hidden bg-amber-200 dark:bg-amber-200/40",
        ].join(" ")}
      >
        {cell.tone === "partial" ? (
          <span className="absolute inset-y-0 right-0 w-1/2 bg-amber-500 dark:bg-amber-300" />
        ) : null}
      </span>
      {cell.label}
    </span>
  );
}

export default function LandingComparisonSection() {
  const t = useTranslations("LandingComparisonSection");
  const hasMatrix = t.has("matrix.headers.feature");
  const hasStructuredFootnote = t.has("footnote.notebooklm.label");
  const hasMatrixLegend = t.has("matrix.legend.brify");
  const notebookItemsRaw = t.raw("notebooklm.items");
  const brifyItemsRaw = t.raw("brify.items");
  const notebookLimitationsRaw = t.has("notebooklm.limitations")
    ? t.raw("notebooklm.limitations")
    : [];
  const matrixRowsRaw = hasMatrix ? t.raw("matrix.rows") : [];
  const structuredFootnoteRaw = hasStructuredFootnote ? t.raw("footnote") : null;

  const notebookItems = Array.isArray(notebookItemsRaw)
    ? (notebookItemsRaw as string[])
    : [];
  const brifyItems = Array.isArray(brifyItemsRaw)
    ? (brifyItemsRaw as string[])
    : [];
  const notebookLimitations = Array.isArray(notebookLimitationsRaw)
    ? (notebookLimitationsRaw as string[])
    : [];
  const matrixRows = Array.isArray(matrixRowsRaw)
    ? (matrixRowsRaw as ComparisonMatrixRow[])
    : [];
  const structuredFootnote = structuredFootnoteRaw as ComparisonFootnote | null;

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.35),transparent_48%),linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-6 py-14 md:px-10 md:py-18 dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_42%),linear-gradient(180deg,#08101d_0%,#0c1524_100%)]">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight text-slate-950 dark:text-white md:text-[2rem]">
            {t("title")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-[15px]">
            {t("subtitle")}
          </p>
        </div>

        {hasMatrix ? (
          <>
            {hasMatrixLegend ? (
              <div className="mt-6 hidden flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 md:flex md:text-[13px]">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">
                    <Icon icon="mdi:check" className="h-4 w-4" />
                  </span>
                  <span>{t("matrix.legend.brify")}</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="relative h-2.5 w-2.5 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-200/40">
                    <span className="absolute inset-y-0 right-0 w-1/2 bg-amber-500 dark:bg-amber-300" />
                  </span>
                  <span>{t("matrix.legend.partial")}</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white dark:border-slate-500 dark:bg-transparent" />
                  <span>{t("matrix.legend.none")}</span>
                </div>
              </div>
            ) : null}

            <div className="mt-6 space-y-3 md:hidden">
              {matrixRows.map((row, index) => (
                <details
                  key={`${row.feature}-mobile-${index}`}
                  className="group rounded-2xl border border-slate-200 bg-white/94 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.26)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/86"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                        {row.feature}
                      </p>
                    </div>
                    <Icon
                      icon="mdi:chevron-down"
                      className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180 dark:text-slate-300"
                    />
                  </summary>

                  <div className="space-y-3 border-t border-slate-200 px-4 pb-4 pt-3 dark:border-slate-700">
                    {row.detail ? (
                      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {row.detail}
                      </p>
                    ) : null}

                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/72">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                          {t("matrix.headers.notebooklm")}
                        </span>
                        <MobileStatusBadge cell={row.notebooklm} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 px-3 py-2 dark:border-blue-400/30 dark:bg-blue-500/10">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700 dark:text-blue-200">
                          {t("matrix.headers.brify")}
                        </span>
                        <MobileStatusBadge cell={row.brify} />
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-8 hidden overflow-x-auto rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_24px_48px_-32px_rgba(15,23,42,0.16)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/82 dark:shadow-[0_24px_48px_-30px_rgba(2,6,23,0.65)] md:block">
              <table className="min-w-[720px] w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[48%]" />
                  <col className="w-[26%]" />
                  <col className="w-[26%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 md:px-6">
                      {t("matrix.headers.feature")}
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 md:px-6">
                      {t("matrix.headers.notebooklm")}
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 md:px-6">
                      {t("matrix.headers.brify")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row, index) => (
                    <tr
                      key={`${row.feature}-${index}`}
                      className="border-b border-slate-200/80 last:border-b-0 dark:border-white/10"
                    >
                      <td className="px-5 py-4 md:px-6">
                        <p className="break-words text-sm font-semibold leading-6 text-slate-900 dark:text-white md:text-[15px]">
                          {row.feature}
                        </p>
                        {row.detail ? (
                          <p className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400 md:text-[13px]">
                            {row.detail}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 align-middle md:px-6">
                        <StatusPill {...row.notebooklm} />
                      </td>
                      <td className="px-5 py-4 align-middle md:px-6">
                        <StatusPill {...row.brify} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {structuredFootnote ? (
              <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.16)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/82 dark:shadow-[0_14px_30px_-22px_rgba(2,6,23,0.58)]">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-900/78">
                    <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white dark:bg-white dark:text-slate-950">
                      {structuredFootnote.notebooklm.label}
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200 md:text-[15px]">
                      {structuredFootnote.notebooklm.text}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
                    <div className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white dark:bg-blue-400 dark:text-slate-950">
                      {structuredFootnote.brify.label}
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-100 md:text-[15px]">
                      {structuredFootnote.brify.text}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-4 text-sm font-semibold leading-6 text-slate-700 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.16)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/82 dark:text-slate-200 md:text-[15px]">
                {t("footnote")}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <ComparisonCard
                badge={t("notebooklm.badge")}
                title={t("notebooklm.title")}
                description={t("notebooklm.description")}
                items={notebookItems}
                limitations={notebookLimitations}
                accent="slate"
              />
              <ComparisonCard
                badge={t("brify.badge")}
                title={t("brify.title")}
                description={t("brify.description")}
                items={brifyItems}
                accent="blue"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-4 text-sm font-semibold leading-6 text-slate-700 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.16)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/82 dark:text-slate-200 md:text-[15px]">
              {t("footnote")}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
