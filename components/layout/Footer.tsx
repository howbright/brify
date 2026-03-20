"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

const supportLinks = [
  { href: "/terms", labelKey: "terms" },
  { href: "/privacy", labelKey: "privacy" },
  { href: "/refund-policy", labelKey: "refundPolicy" },
  { href: "/support", labelKey: "support" },
  { href: "/pricing", labelKey: "pricing" },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="
          text-[14px] font-medium text-slate-500 transition-colors
          hover:text-blue-700
          dark:text-slate-400 dark:hover:text-blue-300
        "
      >
        {label}
      </Link>
    </li>
  );
}

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer
      className="
        relative overflow-hidden border-t border-slate-200/80
        bg-[linear-gradient(180deg,#eef5ff_0%,#e3eeff_34%,#f7fbff_100%)]
        px-6 py-12
        dark:border-white/10
        dark:bg-[linear-gradient(180deg,#0d1526_0%,#0a1220_42%,#08101b_100%)]
        md:px-10 md:py-14
      "
    >
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(520px_220px_at_12%_0%,rgba(59,130,246,0.18),transparent_64%),radial-gradient(520px_220px_at_88%_0%,rgba(99,102,241,0.14),transparent_64%)]
          dark:bg-[radial-gradient(520px_220px_at_12%_0%,rgba(59,130,246,0.18),transparent_64%),radial-gradient(520px_220px_at_88%_0%,rgba(99,102,241,0.18),transparent_64%)]
        "
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/images/newlogo.png"
                alt="Brify"
                width={42}
                height={42}
                className="h-10 w-10 rounded-xl"
              />
              <div>
                <div className="text-[24px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Brify
                </div>
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  by vision328
                </div>
              </div>
            </div>

            <p className="mt-5 max-w-md text-[15px] font-semibold leading-7 text-slate-700 dark:text-slate-200">
              {t("description")}
            </p>

            <div className="mt-6 space-y-1.5 text-[14px] font-medium text-slate-700 dark:text-slate-300">
              <p>{t("company.representative")}</p>
              <p>{t("company.businessNumber")}</p>
              <p>{t("company.mailOrderNumber")}</p>
            </div>
          </div>

          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              {t("contact.title")}
            </div>
            <div className="mt-4 space-y-2 text-[14px] font-medium text-slate-500 dark:text-slate-400">
              <p>contact@brify.ai</p>
              <p>000-0000-0000</p>
              <p>{t("contact.address")}</p>
            </div>
          </div>

          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              {t("support.title")}
            </div>
            <ul className="mt-4 space-y-3">
              {supportLinks.map((link) => (
                <FooterLink
                  key={link.href}
                  href={link.href}
                  label={t(`support.links.${link.labelKey}`)}
                />
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-5 text-sm font-medium text-slate-500 dark:border-white/10 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} vision328. {t("copyright")}</div>
          <div className="text-sm">{t("operatedBy")}</div>
        </div>
      </div>
    </footer>
  );
}
