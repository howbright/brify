"use client";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function LoginForm() {
  const supabase = createClient();
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const router = useRouter();
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setMessage("");
      // Supabase 대시보드에서 SITE URL / Redirect URL 설정해두었다는 전제
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });

      if (error) {
        setMessage("구글 로그인에 실패했어요: " + error.message);
        setMessageType("error");
        setIsGoogleLoading(false);
      }
      // 성공 시에는 구글 로그인 플로우로 리다이렉트되므로 여기서 따로 처리할 건 거의 없음
    } catch (e: any) {
      setMessage("구글 로그인 중 오류가 발생했어요.");
      setMessageType("error");
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
      },
    });

    setIsSubmitting(false);

    if (error?.message.includes("Signups not allowed")) {
      setMessage("가입되지 않은 이메일입니다. 먼저 회원가입을 해주세요.");
      setMessageType("error");
    } else if (error) {
      setMessage("오류가 발생했어요: " + error.message);
      setMessageType("error");
    } else {
      setMessage("인증 코드를 이메일로 보냈습니다.");
      setMessageType("success");
      setStep("otp");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
  
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });
  
    if (error) {
      setIsSubmitting(false);
      setMessage("인증에 실패했습니다: " + error.message);
      setMessageType("error");
      return;
    }
  
    // ✅ 세션이 생성되었으므로 user id를 확인합니다.
    const userId = data?.session?.user?.id;
  
    if (!userId) {
      setIsSubmitting(false);
      setMessage("로그인 세션을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      setMessageType("error");
      return;
    }
  
    // ✅ 가입 완료 여부(profiles.terms_accepted)를 확인합니다.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("terms_accepted")
      .eq("id", userId)
      .maybeSingle();
  
    // profile row가 없거나, terms_accepted가 true가 아니면 => 가입 미완료
    const isCompletedSignup = !!profile && profile.terms_accepted === true;
  
    if (profileError || !isCompletedSignup) {
      // (선택) 로그인 상태를 유지하지 않도록 로그아웃합니다.
      await supabase.auth.signOut();
  
      setIsSubmitting(false);
      setMessage("회원가입이 완료되지 않았습니다. 회원가입을 먼저 진행해 주세요.");
      setMessageType("error");
  
      // 로그인 화면에서 회원가입 페이지로 이동합니다.
      router.push("/signup");
      return;
    }
  
    setIsSubmitting(false);
    setMessage("로그인에 성공했습니다. 환영합니다.");
    setMessageType("success");
    router.push("/dashboard");
  };
  
  

  return (
    <div className="w-full col-span-6 mx-auto sm:max-w-lg rounded-3xl border border-neutral-200 bg-white/95 dark:bg-[#020617] dark:border-white/12 shadow-[0_22px_45px_-28px_rgba(15,23,42,0.85)]">
      <div className="p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            {t("title")}
          </h1>
          {/* <p className="text-sm text-neutral-500 dark:text-neutral-400">
            이메일로 받은 인증 코드 또는 Google 계정으로 로그인할 수 있어요.
          </p> */}
        </div>

        {/* 👉 소셜 로그인 (Google만) */}
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
              dark:bg-white/5 dark:border-white/20 dark:text-neutral-50
              transition-all disabled:opacity-60 disabled:hover:shadow-none disabled:hover:translate-y-0
            "
          >
            {isGoogleLoading ? (
              <>
                <Icon icon="lucide:loader" className="animate-spin" width={18} />
                <span className="ml-1">Google 로그인 중...</span>
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

        {/* 👉 이메일 기반 OTP 로그인 */}
        {step === "email" ? (
          <form className="space-y-5" onSubmit={handleEmailSubmit}>
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
                dark:bg-white dark:text-neutral-900 dark:border-white
                transition-shadow
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0
              "
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader" className="animate-spin" width={18} />
                  처리 중...
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
                인증 코드
              </label>
              <input
                type="text"
                id="token"
                ref={otpInputRef}
                placeholder="이메일로 받은 6자리 코드를 입력하세요"
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
                dark:bg-white dark:text-neutral-900 dark:border-white
                transition-transform transition-shadow
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0
              "
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader" className="animate-spin" width={18} />
                  확인 중...
                </>
              ) : (
                "인증 완료"
              )}
            </button>
          </form>
        )}

        {/* 👉 회원가입 링크 */}
        <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
          {t("signup.question")}{" "}
          <Link
            href="/signup"
            className="font-semibold hover:underline text-neutral-900 dark:text-white"
          >
            {t("signup.link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
