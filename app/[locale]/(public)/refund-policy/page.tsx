import { useTranslations } from "next-intl";

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-300/90 bg-white/92 p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.28)] backdrop-blur sm:p-6 dark:border-white/12 dark:bg-white/[0.04] dark:shadow-[0_28px_80px_-56px_rgba(0,0,0,0.7)]">
      <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-2.5 text-[15px] leading-7 text-slate-700 dark:text-white/82">
        {children}
      </div>
    </section>
  );
}

function KeyFact({
  title,
  value,
  tone = "blue",
}: {
  title: string;
  value: string;
  tone?: "blue" | "amber" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200/80 bg-amber-50/90 text-amber-900 dark:border-amber-300/15 dark:bg-amber-400/10 dark:text-amber-50"
      : tone === "emerald"
        ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-900 dark:border-emerald-300/15 dark:bg-emerald-400/10 dark:text-emerald-50"
        : "border-blue-200/80 bg-blue-50/90 text-blue-900 dark:border-blue-300/15 dark:bg-blue-400/10 dark:text-blue-50";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <div className="text-[12px] font-semibold uppercase tracking-[0.14em] opacity-75">
        {title}
      </div>
      <div className="mt-1 text-[17px] font-black tracking-[-0.02em]">
        {value}
      </div>
    </div>
  );
}

export default function RefundPolicyPage() {
  const t = useTranslations("RefundPolicyPage");

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_38%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.9))] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(11,18,32,0.98))]" />

      <div className="relative mx-auto flex max-w-4xl flex-col gap-6 px-4 pb-14 pt-28 md:pt-32">
        <section className="overflow-hidden rounded-[32px] border border-slate-300/90 bg-white/92 p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.3)] backdrop-blur sm:p-8 dark:border-white/12 dark:bg-white/[0.04] dark:shadow-[0_32px_100px_-62px_rgba(0,0,0,0.82)]">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[12px] font-semibold tracking-[0.12em] text-blue-700 dark:border-blue-300/15 dark:bg-blue-400/10 dark:text-blue-100">
            {t("badge")}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-[38px] dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-[16px] dark:text-white/68">
            {t("intro")}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <KeyFact
              title={t("facts.validityTitle")}
              value={t("facts.validityValue")}
            />
            <KeyFact
              title={t("facts.changeOfMindTitle")}
              value={t("facts.changeOfMindValue")}
              tone="amber"
            />
            <KeyFact
              title={t("facts.methodTitle")}
              value={t("facts.methodValue")}
              tone="emerald"
            />
          </div>
        </section>

        <PolicySection title={t("sections.scope.title")}>
          <p>
            {t("sections.scope.body")}
          </p>
        </PolicySection>

        <PolicySection title={t("sections.validity.title")}>
          <p>{t("sections.validity.body")}</p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {t("sections.validity.note")}
          </p>
        </PolicySection>

        <PolicySection title={t("sections.eligibility.title")}>
          <p>{t("sections.eligibility.body1")}</p>
          <p>{t("sections.eligibility.body2")}</p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {t("sections.eligibility.note")}
          </p>
        </PolicySection>

        <PolicySection title={t("sections.limitations.title")}>
          <p>{t("sections.limitations.body1")}</p>
          <p>{t("sections.limitations.body2")}</p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {t("sections.limitations.note1")}
          </p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {t("sections.limitations.note2")}
          </p>
        </PolicySection>

        <PolicySection title={t("sections.exceptions.title")}>
          <p>
            {t("sections.exceptions.body")}
          </p>
        </PolicySection>

        <PolicySection title={t("sections.request.title")}>
          <p>{t("sections.request.body")}</p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {t("sections.request.note")}
          </p>
        </PolicySection>

        <PolicySection title={t("sections.processing.title")}>
          <p>
            {t("sections.processing.body")}
          </p>
        </PolicySection>

        <PolicySection title={t("sections.contact.title")}>
          <p className="font-semibold text-slate-900 dark:text-white">
            {t("sections.contact.email")}
          </p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {t("sections.contact.note")}
          </p>
        </PolicySection>
      </div>
    </div>
  );
}
