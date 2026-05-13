"use client";

import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { dispatchNavigationStart } from "@/app/lib/dispatchNavigationStart";

export default function LandingSampleSection({
  isAuthed = false,
}: {
  isAuthed?: boolean;
}) {
  const t = useTranslations("LandingBlueHero");
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCta, setPendingCta] = useState(false);
  const ctaHref = isAuthed ? "/video-to-map" : "/signup?next=%2Fvideo-to-map";

  useEffect(() => {
    setPendingCta(false);
  }, [pathname]);

  useEffect(() => {
    void router.prefetch(isAuthed ? "/video-to-map" : "/signup");
  }, [isAuthed, router]);

  const startNavigationFeedback = () => {
    setPendingCta(true);
    dispatchNavigationStart("sample-cta");
  };

  return (
    <section className="mx-auto hidden max-w-7xl px-6 pb-16 md:block md:px-10 md:pb-20">
      <div className="rounded-3xl border border-slate-300/90 bg-white/82 p-4 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.36)] backdrop-blur-sm dark:border-white/15 dark:bg-white/[0.04]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 md:text-xl">
            {t("sampleSection.title")}
          </h2>
          <Link
            href={ctaHref}
            onClick={startNavigationFeedback}
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            aria-busy={pendingCta ? "true" : "false"}
            style={
              pendingCta
                ? { transform: "scale(0.985)", filter: "brightness(0.96)" }
                : undefined
            }
          >
            {t("sampleSection.cta")}
          </Link>
        </div>

        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
          <Image
            src="/images/example.png"
            alt={t("sampleSection.imageAlt")}
            fill
            sizes="(max-width: 1024px) 100vw, 1100px"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
