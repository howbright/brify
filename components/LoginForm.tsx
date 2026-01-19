"use client";

import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function LoginForm() {
  const supabase = createClient();
  const t = useTranslations("login");
  const locale = useLocale(); // e.g. "ko", "en", ...
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "otp" && otpInputRef.current) otpInputRef.current.focus();
  }, [step]);

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setMessage("");

      const next =
        new URLSearchParams(window.location.search).get("next") ?? "/video-to-map";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(
            next
          )}`,
          // (참고) OAuth는 이메일 템플릿을 안 타는 경우가 많아서
          // language를 템플릿에 심는 목적이라면 OTP 흐름에서 주로 필요함.
        },
      });

      if (error) {
        setMessage(t("messages.googleFail", { message: error.message }));
        setMessageType("error");
        setIsGoogleLoading(false);
      }
    } catch {
      setMessage(t("messages.googleError"));
      setMessageType("error");
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    const lang = locale === "ko" ? "ko" : "en"; // ✅ submit 시점에 확정

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        // ✅ 이메일 템플릿에서 {{ .Data.language }} 로 접근 가능
        data: { language: lang },
      },
    });

    setIsSubmitting(false);

    if (error?.message.includes("Signups not allowed")) {
      setMessage(t("messages.signupsNotAllowed"));
      setMessageType("error");
    } else if (error) {
      setMessage(t("messages.genericError", { message: error.message }));
      setMessageType("error");
    } else {
      setMessage(t("messages.codeSent"));
      setMessageType("success");
      setStep("otp");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });

    if (error) {
      setIsSubmitting(false);
      setMessage(t("messages.verifyFail", { message: error.message }));
      setMessageType("error");
      return;
    }
    const lang = locale === "ko" ? "ko" : "en"; // ✅ submit 시점에 확정

    // ✅ (권장) 예전에 가입한 유저/메타데이터 없는 유저 대비:
    // OTP 성공 후 user_metadata에 language를 저장해두면,
    // 다음 이메일 템플릿에서도 안정적으로 언어 분기 가능
    try {
      await supabase.auth.updateUser({
        data: { language: lang },
      });
    } catch {
      // 언어 저장 실패는 로그인 자체를 막을 필요는 없으니 무시
    }

    setIsSubmitting(false);
    setMessageType("success");
    setMessage(t("messages.verifySuccessMoving"));

    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    router.push(`/auth/callback?next=${encodeURIComponent(next)}`);
  };

  return (
    <div
      className="
        w-full col-span-6 mx-auto sm:max-w-lg
        rounded-3xl border border-neutral-200
        bg-white/95
        shadow-[0_22px_45px_-28px_rgba(15,23,42,0.85)]
        dark:border-white/10
        dark:bg-[#0b1220]/95
        dark:shadow-[0_28px_70px_-34px_rgba(0,0,0,0.85)]
        backdrop-blur
      "
    >
      <div className="p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            {t("title")}
          </h1>
        </div>

        {/* 👉 Social (Google) */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isSubmitting}
            className="
              flex items-center justify-center w-full
              rounded-2xl border border-neutral-300 bg-white
              py-2.5 px-5 text-sm font-medium text-neutral-900
              hover:-translate-y-0.5 hover:shadow-md
              transition-all
              disabled:opacity-60 disabled:hover:shadow-none disabled:hover:translate-y-0

              dark:bg-white/6
              dark:border-white/14
              dark:text-neutral-50
              dark:hover:bg-white/10
              dark:hover:border-white/20
              dark:hover:shadow-[0_16px_40px_-26px_rgba(0,0,0,0.85)]
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

        {/* 👉 Divider */}
        <div className="flex items-center text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
          <div className="grow border-t border-neutral-200 dark:border-white/10" />
          <span className="px-3">{t("or")}</span>
          <div className="grow border-t border-neutral-200 dark:border-white/10" />
        </div>

        {/* 👉 Email OTP */}
        {step === "email" ? (
          <form className="space-y-5" onSubmit={handleEmailSubmit}>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-800 dark:text-neutral-100"
              >
                {t("email.label")}
              </label>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("otp.hint")}
              </p>

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

                  dark:bg-white/5
                  dark:border-white/14
                  dark:text-neutral-50
                  dark:placeholder:text-neutral-500
                  dark:focus:border-blue-400/60
                  dark:focus:ring-blue-400/35
                "
                required
              />
            </div>

            {message && (
              <p
                className={`text-sm text-center ${
                  messageType === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="
                w-full mt-2 inline-flex justify-center items-center gap-2
                rounded-2xl px-4 py-2.5 text-sm font-semibold
                text-white bg-neutral-900 border border-neutral-900
                hover:bg-neutral-950 hover:-translate-y-0.5 hover:shadow-lg
                active:translate-y-0
                transition-shadow
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0

                dark:bg-gradient-to-r dark:from-blue-600 dark:via-indigo-500 dark:to-purple-500
                dark:border-white/10
                dark:text-white
                dark:hover:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.75)]
              "
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader" className="animate-spin" width={18} />
                  {t("loading")}
                </>
              ) : (
                t("submit")
              )}
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleOtpSubmit}>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="token"
                className="block text-sm font-medium text-neutral-800 dark:text-neutral-100"
              >
                {t("otp.label")}
              </label>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("otp.hint")}
              </p>

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

                  dark:bg-white/5
                  dark:border-white/14
                  dark:text-neutral-50
                  dark:placeholder:text-neutral-500
                  dark:focus:border-blue-400/60
                  dark:focus:ring-blue-400/35
                "
                required
              />
            </div>

            {message && (
              <p
                className={`text-sm text-center ${
                  messageType === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="
                w-full inline-flex justify-center items-center gap-2
                rounded-2xl px-4 py-2.5 text-sm font-semibold
                text-white bg-neutral-900 border border-neutral-900
                hover:bg-neutral-950 hover:-translate-y-0.5 hover:shadow-lg
                active:translate-y-0
                transition-transform transition-shadow
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0

                dark:bg-gradient-to-r dark:from-blue-600 dark:via-indigo-500 dark:to-purple-500
                dark:border-white/10
                dark:text-white
                dark:hover:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.75)]
              "
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader" className="animate-spin" width={18} />
                  {t("otp.loading")}
                </>
              ) : (
                t("otp.submit")
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
