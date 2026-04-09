"use client";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SignupForm() {
  const supabase = createClient();
  const t = useTranslations("signup");
  const locale = useLocale();
  const lang = locale === "ko" ? "ko" : "en";

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const otpInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const validateEmail = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return t("email.errors.required");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalized)) {
      return t("email.errors.invalid");
    }

    return "";
  };

  const requireAgreementsOrShowError = () => {
    if (!agreeTerms || !agreePrivacy) {
      setMessage(t("errors.agreeRequired"));
      setMessageType("error");
      return false;
    }
    return true;
  };

  const buildAuthCallbackUrl = () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL;
    return new URL("/auth/callback", origin);
  };

  const handleGoogleSignup = async () => {
    if (!requireAgreementsOrShowError()) return;

    try {
      setIsGoogleLoading(true);
      setMessage("");

      const redirectUrl = buildAuthCallbackUrl();
      const nextPath = `/${locale}/video-to-map`;
      redirectUrl.searchParams.set("flow", "signup");
      redirectUrl.searchParams.set("terms", "1");
      redirectUrl.searchParams.set("locale", locale);
      redirectUrl.searchParams.set("next", nextPath);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl.toString(),
        },
      });

      if (error) {
        setMessage(`${t("errors.googlePrefix")} ${error.message}`);
        setMessageType("error");
        setIsGoogleLoading(false);
      }
    } catch {
      setMessage(t("errors.googleGeneric"));
      setMessageType("error");
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAgreementsOrShowError()) {
      return;
    }

    const nextEmailError = validateEmail(email);
    if (nextEmailError) {
      setEmailError(nextEmailError);
      setMessage("");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const redirectUrl = buildAuthCallbackUrl();
    const nextPath = `/${locale}/video-to-map`;
    redirectUrl.searchParams.set("flow", "signup");
    redirectUrl.searchParams.set("terms", "1");
    redirectUrl.searchParams.set("locale", locale);
    redirectUrl.searchParams.set("next", nextPath);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectUrl.toString(),
        data: { language: lang },
      },
    });

    if (error?.message.includes("Signups not allowed")) {
      setMessage(t("errors.alreadyRegistered"));
      setMessageType("error");
    } else if (error) {
      setMessage(`${t("errors.defaultPrefix")} ${error.message}`);
      setMessageType("error");
    } else {
      setMessage(t("success.otpSent"));
      setMessageType("success");
      setStep("otp");
    }

    setIsSubmitting(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    const {
      data: { session },
      error,
    } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });
  
    if (error) {
      setMessage(`${t("errors.otpFailedPrefix")} ${error.message}`);
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }
  
    const user = session?.user;

    try {
      await supabase.auth.updateUser({
        data: { language: lang },
      });
    } catch {
      // 언어 저장 실패는 가입 자체를 막을 필요는 없으니 무시
    }
  
    // ✅ 프로필 업서트(크레딧은 만지지 않음)
    if (user) {
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? email.trim(),
          locale,
          terms_accepted: true,
        },
        { onConflict: "id" }
      );
  
      if (upsertError) {
        console.error("프로필 upsert 실패:", upsertError.message);
        // 프로필 upsert 실패해도 가입 자체는 되었으니 흐름은 계속 진행
      }
    }
  
    // ✅ B) 회원가입 보상 지급 API 호출 (세션 생성 후 /video-to-map 이동 전)
    // - 서버에서 credit_transactions(reason='signup_reward')로 중복 방지한다고 가정
    try {
      const res = await fetch("/api/rewards/signup", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
  
      // 실패해도 회원가입/로그인은 성공이므로 UX 깨지지 않게 조용히 처리
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.warn("signup reward failed:", data?.error ?? res.statusText);
      }
    } catch (err) {
      console.warn("signup reward request error:", err);
    }
  
    setMessage(t("success.otpVerified"));
    setMessageType("success");
    router.push(`/${locale}/video-to-map`);
    setIsSubmitting(false);
  };
  

  return (
    <div
      className="
        w-full col-span-6 mx-auto sm:max-w-lg
        rounded-3xl border border-slate-400 bg-white
        shadow-[0_22px_45px_-28px_rgba(15,23,42,0.85)]
        dark:border-white/35
        dark:bg-[linear-gradient(180deg,#0d1728_0%,#0a1322_100%)]
        dark:shadow-[0_28px_70px_-34px_rgba(0,0,0,0.92)]
      "
    >
      <div className="flex flex-col gap-6 p-7 sm:p-9">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-black tracking-tight text-neutral-900 dark:text-white sm:text-[28px]">
            {t("title")}
          </h1>
          <p className="text-[15px] text-neutral-500 dark:text-neutral-400">
            {t("subtitle")}
          </p>
        </div>

        {step === "email" && (
          <div className="flex flex-col gap-3 text-[15px] text-neutral-700 dark:text-neutral-200">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-white/35"
                required
              />
              <span>
                {t("terms.agreePrefix")}
                <Link
                  href="/terms"
                  className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {t("terms.termsLink")}
                </Link>
                {t("terms.agreeSuffix")}
              </span>
            </label>

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={() => setAgreePrivacy(!agreePrivacy)}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-white/35"
                required
              />
              <span>
                {t("terms.agreePrivacyPrefix")}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {t("terms.privacyLink")}
                </Link>
                {t("terms.agreePrivacySuffix")}
              </span>
            </label>
          </div>
        )}

        {message && (
          <p
            className={clsx(
              "text-base text-center",
              messageType === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {message}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading || isSubmitting}
            className="
              flex items-center justify-center w-full
              rounded-2xl border border-slate-400 bg-white
              py-3 px-5 text-[17px] font-medium text-neutral-900
              hover:-translate-y-0.5 hover:shadow-md
              dark:bg-white/[0.09] dark:border-white/30 dark:text-neutral-50
              dark:hover:bg-white/[0.13] dark:hover:border-white/40
              transition-all disabled:opacity-60 disabled:hover:shadow-none disabled:hover:translate-y-0
            "
          >
            {isGoogleLoading ? (
              <>
                <Icon icon="lucide:loader" className="animate-spin" width={18} />
                <span className="ml-1">{t("googleLoading")}</span>
              </>
            ) : (
              <span className="flex items-center gap-2">
                <Icon icon="logos:google-icon" width={19} />
                {t("google")}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <div className="grow border-t border-slate-400 dark:border-white/28" />
          <span className="px-3">{t("or")}</span>
          <div className="grow border-t border-slate-400 dark:border-white/28" />
        </div>

        {step === "email" ? (
          <form className="flex flex-col gap-5" onSubmit={handleEmailSubmit}>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="block text-[17px] font-medium text-neutral-800 dark:text-neutral-100"
              >
                {t("email.label")}
              </label>
              <input
                type="email"
                id="email"
                placeholder={t("email.placeholder")}
                value={email}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setEmail(nextValue);
                  if (emailError) {
                    setEmailError(validateEmail(nextValue));
                  }
                }}
                onBlur={() => setEmailError(validateEmail(email))}
                className={`
                  w-full rounded-2xl border bg-white
                  px-4 py-3 text-base text-neutral-900
                  placeholder:text-[15px] placeholder:text-neutral-400
                  focus:outline-none focus:ring-2
                  dark:bg-white/[0.07] dark:text-neutral-50 dark:placeholder:text-neutral-500
                  ${
                    emailError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/30 dark:border-red-400/70 dark:focus:border-red-300 dark:focus:ring-red-400/25"
                      : "border-slate-400 focus:border-blue-500 focus:ring-blue-500/70 dark:border-white/30 dark:focus:border-blue-300/75 dark:focus:ring-blue-400/40"
                  }
                `}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? "signup-email-error" : undefined}
                required
              />

              {emailError ? (
                <p
                  id="signup-email-error"
                  className="text-[14px] font-medium text-red-600 dark:text-red-400"
                >
                  {emailError}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="
                w-full inline-flex items-center justify-center gap-2
                rounded-2xl px-4 py-3 text-[17px] font-semibold
                text-white bg-neutral-900 border border-neutral-900
                hover:bg-neutral-950 hover:-translate-y-0.5 hover:shadow-lg
                active:translate-y-0
                dark:bg-gradient-to-r dark:from-blue-600 dark:via-blue-500 dark:to-cyan-500
                dark:border-white/28 dark:text-white
                transition-transform transition-shadow
                dark:hover:shadow-[0_18px_50px_-28px_rgba(37,99,235,0.8)]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0
              "
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader" className="animate-spin" width={18} />
                  {t("buttons.sendingCode")}
                </>
              ) : (
                <>{t("buttons.sendCode")}</>
              )}
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-5" onSubmit={handleOtpSubmit}>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="token"
                className="block text-[17px] font-medium text-neutral-800 dark:text-neutral-100"
              >
                {t("otp.label")}
              </label>
              <input
                type="text"
                id="token"
                ref={otpInputRef}
                placeholder={t("otp.placeholder")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="
                  w-full rounded-2xl border border-slate-400 bg-white
                  px-4 py-3 text-base text-neutral-900
                  placeholder:text-[15px] placeholder:text-neutral-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500
                  dark:bg-white/[0.07] dark:border-white/30 dark:text-neutral-50 dark:placeholder:text-neutral-500
                  dark:focus:border-blue-300/75 dark:focus:ring-blue-400/40
                "
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="
                w-full inline-flex items-center justify-center gap-2
                rounded-2xl px-4 py-3 text-[17px] font-semibold
                text-white bg-neutral-900 border border-neutral-900
                hover:bg-neutral-950 hover:-translate-y-0.5 hover:shadow-lg
                active:translate-y-0
                dark:bg-gradient-to-r dark:from-blue-600 dark:via-blue-500 dark:to-cyan-500
                dark:border-white/28 dark:text-white
                transition-transform transition-shadow
                dark:hover:shadow-[0_18px_50px_-28px_rgba(37,99,235,0.8)]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0
              "
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader" className="animate-spin" width={18} />
                  {t("buttons.verifying")}
                </>
              ) : (
                <>{t("buttons.verify")}</>
              )}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
          {t("login.question")}{" "}
          <Link
            href="/login"
            className="font-semibold hover:underline text-neutral-900 dark:text-white"
          >
            {t("login.link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
