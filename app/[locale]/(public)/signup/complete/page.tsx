// app/[locale]/(main)/signup/complete/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SignupCompletePage() {
  const supabase = createClient();
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ 서명 검증은 "쿼리 원본 next" 그대로 써야 함
  const nextForSig = sp.get("next") ?? "/";

  // ✅ 실제 이동은 UX 기준으로 보정
  // "/"면 /video-to-map으로 보내기 (너 미들웨어가 locale 붙여준다 했으니 강제 locale prefix 안 붙임)
  const redirectTo = useMemo(() => {
    return nextForSig === "/" ? "/video-to-map" : nextForSig;
  }, [nextForSig]);

  const uidFromQuery = sp.get("uid") ?? "";
  const sigFromQuery = sp.get("sig") ?? "";

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const hasSignedUid = useMemo(() => {
    return Boolean(uidFromQuery && sigFromQuery);
  }, [uidFromQuery, sigFromQuery]);

  useEffect(() => {
    let alive = true;

    async function sleep(ms: number) {
      return new Promise((r) => setTimeout(r, ms));
    }

    async function boot() {
      setLoading(true);
      setMessage("");

      let sessionUser: any = null;

      for (let i = 0; i < 10; i++) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        sessionUser = session?.user ?? null;
        if (sessionUser) break;

        await sleep(150);
        if (!alive) return;
      }

      if (!alive) return;

      if (!sessionUser) {
        setLoading(false);

        if (!hasSignedUid) {
          setMessage(
            "가입 완료 링크 정보(uid/sig)가 없어 처리를 진행할 수 없습니다. 다시 로그인/가입을 시도해 주세요."
          );
          setMessageType("error");
        } else {
          setMessage(
            "로그인 정보를 확인하는 중입니다. 잠시 후 동의 후 진행해 주세요."
          );
          setMessageType("error");
        }
        return;
      }

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
  }, [router, supabase, hasSignedUid, redirectTo]);

  const requireAgreementsOrShowError = () => {
    if (!agreeTerms || !agreePrivacy) {
      setMessage("약관에 동의해 주세요.");
      setMessageType("error");
      return false;
    }
    return true;
  };

  async function handleComplete() {
    if (!requireAgreementsOrShowError()) return;

    if (!hasSignedUid) {
      setMessage(
        "가입 완료 링크 정보(uid/sig)가 없어 처리를 진행할 수 없습니다. 다시 로그인/가입을 시도해 주세요."
      );
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const r = await fetch("/api/signup/complete", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: uidFromQuery,
          sig: sigFromQuery,
          next: nextForSig, // ✅ 서명 검증과 동일한 next(원본)로 보내야 함
        }),
      });

      const j = await r.json().catch(() => null);

      if (!r.ok || !j?.ok) {
        setSubmitting(false);
        setMessage(
          `가입 완료 처리 중 오류가 발생했습니다. (${j?.error ?? "UNKNOWN"})`
        );
        setMessageType("error");
        return;
      }

      setMessage("가입이 완료되었습니다. 이동합니다...");
      setMessageType("success");
      router.replace(redirectTo);
    } catch (e: any) {
      setSubmitting(false);
      setMessage(`네트워크 오류가 발생했습니다. (${e?.message ?? "NETWORK"})`);
      setMessageType("error");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md pt-52 px-5">
        <div className="rounded-3xl px-3 border border-neutral-200 bg-white/95 p-6 shadow-[0_22px_45px_-28px_rgba(15,23,42,0.35)] dark:border-white/12 dark:bg-[#020617]">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <Icon icon="lucide:loader" className="animate-spin" />
            확인 중입니다...
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
              회원가입 완료
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              서비스 이용을 위해 약관 동의가 필요합니다.
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
                이용약관에 동의합니다.{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  이용약관
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
                개인정보 처리방침에 동의합니다.{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  개인정보 처리방침
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
                <Icon
                  icon="lucide:loader"
                  className="animate-spin"
                  width={18}
                />
                처리 중...
              </>
            ) : (
              <>동의하고 시작하기</>
            )}
          </button>

          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            동의 후 서비스 이용이 가능합니다. 동의 내용을 확인하려면 약관 링크를
            눌러 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
