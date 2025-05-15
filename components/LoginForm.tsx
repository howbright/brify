"use client";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function LoginForm() {
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
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

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setIsSubmitting(false);

    if (error) {
      setMessage("인증 실패: " + error.message);
      setMessageType("error");
    } else {
      setMessage("로그인 성공! 환영합니다.");
      setMessageType("success");
      router.push("/summarize");
    }
  };

  return (
    <div className="w-full col-span-6 mx-auto border border-gray-900 dark:border-white/20 bg-white dark:bg-black rounded-lg shadow-lg sm:max-w-lg">
      <div className="p-6 sm:p-8 flex flex-col gap-4">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          {t("title")}
        </h1>

        {/* 👉 소셜 로그인 */}
        <div className="flex flex-col gap-3">
          <Link
            href="#"
            className="flex items-center justify-center w-full border border-gray-900 rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Icon icon="logos:google-icon" width={19} />
              {t("google")}
            </span>
          </Link>

          <Link
            href="#"
            className="group flex items-center justify-center w-full border border-gray-900 rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            <div className="flex gap-x-3 items-center">
              <Icon
                icon="mdi:apple"
                width={27}
                className="text-[#333] group-hover:text-white transition-colors"
              />
              <span>{t("apple")}</span>
            </div>
          </Link>
        </div>

        {/* 👉 Divider */}
        <div className="flex items-center text-xs font-semibold uppercase text-gray-500 tracking-wider">
          <div className="grow border-t border-gray-300" />
          <span className="px-4">{t("or")}</span>
          <div className="grow border-t border-gray-300" />
        </div>

        {/* 👉 이메일 인증 */}
        {step === "email" ? (
          <form className="space-y-5" onSubmit={handleEmailSubmit}>
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium">
                {t("email.label")}
              </label>
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 flex justify-center items-center gap-2 bg-primary text-white border border-gray-900 rounded-lg py-2.5 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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

            {message && (
              <p
                className={`text-sm text-center mt-2 ${
                  messageType === "success"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleOtpSubmit}>
            <div>
              <label htmlFor="token" className="block mb-1 text-sm font-medium">
                인증 코드
              </label>
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
                className={`text-sm text-center mt-3 ${
                  messageType === "success"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {message}
              </p>
            )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 bg-primary text-white border border-gray-900 rounded-lg py-2.5 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          {t("signup.question")}{" "}
          <Link
            href="/signup"
            className="font-semibold hover:underline text-black dark:text-white"
          >
            {t("signup.link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
