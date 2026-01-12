// app/[locale]/(main)/signup/complete/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";

export default function SignupCompletePage() {
  const supabase = createClient();
  const router = useRouter();
  const sp = useSearchParams();
  const t = useTranslations("signupComplete");

  // ✅ next는 UX용 이동 목적지(원본 유지)
  const nextForSig = sp.get("next") ?? "/";

  // "/"면 /video-to-map으로 보내기
  const redirectTo = useMemo(() => {
    return nextForSig === "/" ? "/video-to-map" : nextForSig;
  }, [nextForSig]);

  // ✅ (옵션) 서명 기반 플로우: callback에서 넘어온 경우만 존재
  const uidFromQuery = sp.get("uid") ?? "";
  const sigFromQuery = sp.get("sig") ?? "";
  const hasSignedFlow = useMemo(() => {
    return Boolean(uidFromQuery && sigFromQuery);
  }, [uidFromQuery, sigFromQuery]);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    let alive = true;

    async function sleep(ms: number) {
      return new Promise((r) => setTimeout(r, ms));
    }

    async function boot() {
      setLoading(true);
      setMessage("");

      let sessionUser: any = null;

      // 세션이 늦게 잡히는 케이스 대비
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        sessionUser = data.session?.user ?? null;
        if (sessionUser) break;

        await sleep(150);
        if (!alive) return;
      }

      if (!alive) return;

      if (!sessionUser) {
        setLoading(false);
        setMessage(t("messages.sessionNotFound"));
        setMessageType("error");
        return;
      }

      // 이미 terms_accepted=true면 바로 목적지로
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, terms_accepted")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (!alive) return;

      if (!profileError && profile?.terms_accepted === true) {
        router.replace(redirectTo);
        return;
      }

      setLoading(false);
    }

    boot();
    return () => {
      alive = false;
    };
  }, [router, supabase, redirectTo, t]);

  const requireAgreementsOrShowError = () => {
    if (!agreeTerms || !agreePrivacy) {
      setMessage(t("messages.needAllAgreements"));
      setMessageType("error");
      return false;
    }
    return true;
  };

  async function handleComplete() {
    if (!requireAgreementsOrShowError()) return;

    setSubmitting(true);
    setMessage("");

    try {
      // ✅ 서버가 "세션 기반 모드"를 지원하도록 호출
      // - signed flow면: uid/sig/next를 그대로 보냄(기존 호환)
      // - 아니면: next만 보내고(혹은 아예 안 보내도 됨), 서버가 세션 uid로 처리
      const payload: any = {
        next: nextForSig,
      };

      if (hasSignedFlow) {
        payload.uid = uidFromQuery;
        payload.sig = sigFromQuery;
      }

      const r = await fetch("/api/signup/complete", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => null);

      if (!r.ok || !j?.ok) {
        setSubmitting(false);
        setMessage(t("messages.failed", { error: j?.error ?? "UNKNOWN" }));
        setMessageType("error");
        return;
      }

      setMessage(t("messages.successMove"));
      setMessageType("success");
      router.replace(redirectTo);
    } catch (e: any) {
      setSubmitting(false);
      setMessage(t("messages.network", { message: e?.message ?? "NETWORK" }));
      setMessageType("error");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md pt-52 px-5">
        <div className="rounded-3xl px-3 border border-neutral-200 bg-white/95 p-6 shadow-[0_22px_45px_-28px_rgba(15,23,42,0.35)] dark:border-white/12 dark:bg-[#020617]">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <Icon icon="lucide:loader" className="animate-spin" />
            {t("checking")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg pt-40 px-4 py-10">
      <div className="rounded-3xl border border-neutral-200 bg-white/95 shadow-[0_22px_45px_-28px_rgba(15,23,42,0.35)] dark:border-white/12 dark:bg-[#020617]">
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm text-neutral-700 dark:text-neutral-200">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={() => setAgreeTerms((v) => !v)}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                {t("agree.terms")}{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {t("agree.view")}
                </Link>
              </span>
            </label>

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={() => setAgreePrivacy((v) => !v)}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                {t("agree.privacy")}{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {t("agree.view")}
                </Link>
              </span>
            </label>
          </div>

          {message && (
            <p
              className={clsx(
                "text-center text-sm",
                messageType === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={handleComplete}
            disabled={submitting}
            className="
              w-full inline-flex items-center justify-center gap-2
              rounded-2xl px-4 py-2.5 text-sm font-semibold
              text-white bg-neutral-900 border border-neutral-900
              hover:bg-neutral-950 hover:-translate-y-0.5 hover:shadow-lg
              active:translate-y-0
              dark:bg-white dark:text-neutral-900 dark:border-white
              transition-shadow
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0
            "
          >
            {submitting ? (
              <>
                <Icon icon="lucide:loader" className="animate-spin" width={18} />
                {t("button.submitting")}
              </>
            ) : (
              <>{t("button.submit")}</>
            )}
          </button>

          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            {t("helper")}
          </p>
        </div>
      </div>
    </div>
  );
}
