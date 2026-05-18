import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

const SUPPORTED_LOCALES = ["ko", "en", "fr"] as const;

function normalizeRedirectPath(raw: string | string[] | undefined, locale: string) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const next = (value ?? "").trim();

  if (!next || next === "/") return `/${locale}/video-to-map`;
  if (!next.startsWith("/") || next.startsWith("//")) {
    return `/${locale}/video-to-map`;
  }

  if (
    next.includes("/signup/complete") ||
    next.includes("/signup/incomplete") ||
    next === `/${locale}/signup/complete` ||
    next === `/${locale}/signup/incomplete`
  ) {
    return `/${locale}/video-to-map`;
  }

  const hasSupportedLocalePrefix = SUPPORTED_LOCALES.some(
    (supported) => next === `/${supported}` || next.startsWith(`/${supported}/`)
  );

  if (hasSupportedLocalePrefix) return next;
  return `/${locale}${next === "/" ? "" : next}`;
}

export default async function SignupIncompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const t = await getTranslations("signupIncomplete");
  const supabase = await createClient();
  const nextPath = normalizeRedirectPath(sp?.next, locale);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("terms_accepted")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.terms_accepted === true) {
    redirect(nextPath);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-start justify-center px-4 pt-36 pb-12">
      <div className="w-full rounded-3xl border border-neutral-200 bg-white/95 p-7 shadow-[0_22px_45px_-28px_rgba(15,23,42,0.35)] dark:border-white/12 dark:bg-[#020617] sm:p-8">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
            {t("eyebrow")}
          </p>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {t("description")}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">
          {t("hint")}
        </div>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href={{ pathname: "/signup/complete", query: { next: nextPath } }}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-950 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            {t("actions.continueSignup")}
          </Link>

          <form action={`/auth/signout?locale=${locale}`} method="POST" className="w-full">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 dark:border-white/12 dark:bg-transparent dark:text-white dark:hover:bg-white/6"
            >
              {t("actions.useAnotherAccount")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
