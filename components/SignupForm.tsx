"use client";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SignupForm() {
  const supabase = createClient();
  const t = useTranslations("signup");

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true);
      setMessage("");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `https://dev.brify.app/auth/callback`,
        },
      });

      if (error) {
        setMessage(`${t("errors.googlePrefix")} ${error.message}`);
        setMessageType("error");
        setIsGoogleLoading(false);
      }
      // 성공 시엔 구글 로그인 플로우로 리다이렉트됨
    } catch (e: any) {
      setMessage(t("errors.googleGeneric"));
      setMessageType("error");
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    if (!agreeTerms || !agreePrivacy) {
      setMessage(t("errors.agreeRequired"));
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    if (error?.message.includes("Signups not allowed")) {
      setMessage(t("errors.alreadyRegistered"));
      setMessageType("error");
      // setStep("otp")는 안 가는 게 자연스러움
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
    if (user) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        role: "basic",
        remaining_credits: 5,
        initial_credits: 5,
        monthly_reset_credits: 3,
        last_reset: new Date().toISOString().split("T")[0],
        is_pro: false,
        pro_expiration: null,
        locale: navigator.language.slice(0, 2) || "en",
      });

      if (insertError && !insertError.message.includes("duplicate key")) {
        console.error("프로필 생성 실패:", insertError.message);
      }
    }

    setMessage(t("success.otpVerified"));
    setMessageType("success");
    router.push("/summarize");
    setIsSubmitting(false);
  };

  return (
    <div className="w-full col-span-6 mx-auto sm:max-w-lg rounded-3xl border border-neutral-200 bg-white/95 dark:bg-[#020617] dark:border-white/12 shadow-[0_22px_45px_-28px_rgba(15,23,42,0.85)]">
      <div className="p-6 sm:p-8 flex flex-col gap-6">
        {/* 타이틀 & 서브텍스트 */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("subtitle")}
          </p>
        </div>

        {/* 👉 소셜 (Google만) */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading || isSubmitting}
            className="
              flex items-center justify-center w-full
              rounded-2xl border border-neutral-300 bg-white
              py-2.5 px-5 text-sm font-medium text-neutral-900
              hover:-translate-y-0.5 hover:shadow-md
              dark:bg-white/5 dark:border-white/20 dark:text-neutral-50
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

        {/* Divider */}
        <div className="flex items-center text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
          <div className="grow border-t border-neutral-200 dark:border-white/10" />
          <span className="px-3">{t("or")}</span>
          <div className="grow border-t border-neutral-200 dark:border-white/10" />
        </div>

        {/* 👉 이메일 인증 단계 */}
        {step === "email" ? (
          <form className="flex flex-col gap-5" onSubmit={handleEmailSubmit}>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-800 dark:text-neutral-100"
              >
                {t("email.label")}
              </label>
              <input
                type="email"
                id="email"
                placeholder={t("email.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-2xl border border-neutral-300 bg-neutral-50
                  px-3 py-2.5 text-sm text-neutral-900
                  placeholder:text-neutral-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500
                  dark:bg-black/40 dark:border-white/15 dark:text-neutral-50 dark:placeholder:text-neutral-500
                "
                required
              />
            </div>

            {/* 약관 체크 */}
            <div className="text-sm flex flex-col gap-2 text-neutral-700 dark:text-neutral-200">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={() => setAgreeTerms(!agreeTerms)}
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
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
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
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

            {message && (
              <p
                className={clsx(
                  "text-sm text-center",
                  messageType === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="
                w-full inline-flex items-center justify-center gap-2
                rounded-2xl px-4 py-2.5 text-sm font-semibold
                text-white bg-neutral-900 border border-neutral-900
                hover:bg-neutral-950 hover:-translate-y-0.5 hover:shadow-lg
                active:translate-y-0
                dark:bg-white dark:text-neutral-900 dark:border-white
                transition-transform transition-shadow
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
                className="block text-sm font-medium text-neutral-800 dark:text-neutral-100"
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
                  w-full rounded-2xl border border-neutral-300 bg-neutral-50
                  px-3 py-2.5 text-sm text-neutral-900
                  placeholder:text-neutral-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500
                  dark:bg-black/40 dark:border-white/15 dark:text-neutral-50 dark:placeholder:text-neutral-500
                "
                required
              />

              {message && (
                <p
                  className={clsx(
                    "text-sm text-center mt-3",
                    messageType === "success"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="
                w-full inline-flex items-center justify-center gap-2
                rounded-2xl px-4 py-2.5 text-sm font-semibold
                text-white bg-neutral-900 border border-neutral-900
                hover:bg-neutral-950 hover:-translate-y-0.5 hover:shadow-lg
                active:translate-y-0
                dark:bg-white dark:text-neutral-900 dark:border-white
                transition-transform transition-shadow
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

        {/* 로그인 링크 */}
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
