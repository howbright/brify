"use client";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SignupForm() {
  const t = useTranslations("signup");

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!agreeTerms || !agreePrivacy) {
      setMessage("필수 약관에 동의해야 가입할 수 있습니다.");
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error?.message.includes("Signups not allowed")) {
      setMessage("이미 가입된 이메일입니다. 로그인해 주세요.");
      setMessageType("error");
      setStep("otp");
    } else if (error) {
      setMessage("오류가 발생했어요: " + error.message);
      setMessageType("error");
    } else {
      setMessage("입력하신 이메일로 인증 코드를 보냈습니다.");
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
      email,
      token,
      type: "email",
    });

    if (error) {
      setMessage("인증 실패: " + error.message);
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

    setMessage("인증 성공! 환영합니다.");
    setMessageType("success");
    router.push("/summarize");
    setIsSubmitting(false);
  };

  return (
    <div className="w-full col-span-6 mx-auto border border-gray-900 dark:border-white/20 bg-white dark:bg-black rounded-lg shadow-lg sm:max-w-lg">
      <div className="p-6 sm:p-8 space-y-6">
        <h1 className="text-2xl font-black uppercase tracking-tight">{t("title")}</h1>

        {/* 소셜 로그인 */}
        <div className="flex flex-col space-y-3">
          <Link href="#" className="flex items-center justify-center w-full border border-gray-900 rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors">
            <div className="flex gap-x-3 items-center">
              <Icon icon="logos:google-icon" width={19} />
              <span>{t("google")}</span>
            </div>
          </Link>
          <Link href="#" className="group flex items-center justify-center w-full border border-gray-900 rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors">
            <div className="flex gap-x-3 items-center">
              <Icon icon="mdi:apple" width={27} className="text-[#333] group-hover:text-white transition-colors" />
              <span>{t("apple")}</span>
            </div>
          </Link>
        </div>

        {/* Divider */}
        <div className="flex items-center text-xs font-semibold uppercase text-gray-500 tracking-wider">
          <div className="grow border-t border-gray-300" />
          <span className="px-4">{t("or")}</span>
          <div className="grow border-t border-gray-300" />
        </div>

        {/* 이메일 인증 단계 */}
        {step === "email" ? (
          <form className="space-y-5" onSubmit={handleEmailSubmit}>
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium">{t("email.label")}</label>
              <input
                type="email"
                id="email"
                placeholder={t("email.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-900 rounded-lg p-2.5 bg-white dark:bg-black dark:border-white/20 focus:outline-hidden focus:ring-1 focus:ring-black"
                required
              />
            </div>

            <div className="text-sm space-y-2">
              <label className="flex items-start gap-x-2">
                <input type="checkbox" checked={agreeTerms} onChange={() => setAgreeTerms(!agreeTerms)} className="mt-1" required />
                <span>
                  <Link href="/terms" className="underline hover:text-primary">서비스 이용약관</Link>에 동의합니다. (필수)
                </span>
              </label>
              <label className="flex items-start gap-x-2">
                <input type="checkbox" checked={agreePrivacy} onChange={() => setAgreePrivacy(!agreePrivacy)} className="mt-1" required />
                <span>
                  <Link href="/privacy" className="underline hover:text-primary">개인정보 처리방침</Link>에 동의합니다. (필수)
                </span>
              </label>
            </div>

            {message && (
              <p
                className={clsx(
                  "text-sm text-center",
                  messageType === "success"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex items-center justify-center gap-2 w-full bg-primary text-white border border-gray-900 rounded-lg py-2.5 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader" className="animate-spin" width={18} />
                  코드 전송 중...
                </>
              ) : (
                <>코드 보내기</>
              )}
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleOtpSubmit}>
            <div>
              <label htmlFor="token" className="block mb-1 text-sm font-medium">인증 코드</label>
              <input
                type="text"
                id="token"
                ref={otpInputRef}
                placeholder="이메일로 받은 6자리 코드를 입력하세요"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full border border-gray-900 rounded-lg p-2.5 bg-white dark:bg-black dark:border-white/20 focus:outline-hidden focus:ring-1 focus:ring-black"
                required
              />
              {message && (
                <p
                  className={clsx(
                    "text-sm text-center mt-3",
                    messageType === "success"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex items-center justify-center gap-2 w-full bg-primary text-white border border-gray-900 rounded-lg py-2.5 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader" className="animate-spin" width={18} />
                  인증 중...
                </>
              ) : (
                <>인증 완료</>
              )}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          {t("login.question")}{" "}
          <Link href="/login" className="font-semibold hover:underline text-black dark:text-white">
            {t("login.link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
