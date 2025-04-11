"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function SignupForm() {
  const t = useTranslations("signup");

  const [email, setEmail] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!agreeTerms || !agreePrivacy) {
      setMessage("필수 약관에 동의해야 가입할 수 있습니다.");
      return;
    }
  
    const supabase = createClient();
  
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3000/auth/callback",
      },
    });
  
    if (error) {
      console.error(error);
      setMessage("오류가 발생했어요: " + error.message);
    } else {
      setMessage("메일을 확인해주세요! 매직링크를 보냈습니다.");
    }
  };
  

  return (
    <div className="w-full col-span-6 mx-auto border border-gray-900 dark:border-white/20 bg-white dark:bg-black rounded-lg shadow-lg sm:max-w-lg">
      <div className="p-6 sm:p-8 space-y-6">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          {t("title")}
        </h1>

        {/* 소셜 가입 버튼 */}
        <div className="flex flex-col space-y-3">
          <Link
            href="#"
            className="flex items-center justify-center w-full border border-gray-900 rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            <div className="flex gap-x-3 items-center">
              <Icon icon="logos:google-icon" width={19} />
              <span>{t("google")}</span>
            </div>
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

        {/* Divider */}
        <div className="flex items-center text-xs font-semibold uppercase text-gray-500 tracking-wider">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-4">{t("or")}</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* 이메일 입력 + 약관 */}
        <form className="space-y-5" onSubmit={handleSubmit}>
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
              className="w-full border border-gray-900 rounded-lg p-2.5 bg-white dark:bg-black dark:border-white/20 focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
          </div>

          {/* 약관 동의 체크박스 */}
          <div className="text-sm space-y-2">
            <label className="flex items-start gap-x-2">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
                className="mt-1"
                required
              />
              <span>
                <Link
                  href="/terms"
                  className="underline hover:text-primary"
                >
                  서비스 이용약관
                </Link>
                에 동의합니다. (필수)
              </span>
            </label>

            <label className="flex items-start gap-x-2">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={() => setAgreePrivacy(!agreePrivacy)}
                className="mt-1"
                required
              />
              <span>
                <Link
                  href="/privacy"
                  className="underline hover:text-primary"
                >
                  개인정보 처리방침
                </Link>
                에 동의합니다. (필수)
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white border border-gray-900 rounded-lg py-2.5 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors"
          >
            {t("submit")}
          </button>

          {message && (
            <p className="text-sm text-center text-red-600 dark:text-red-400">
              {message}
            </p>
          )}

          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            {t("login.question")}{" "}
            <Link
              href="/login"
              className="font-semibold hover:underline text-black dark:text-white"
            >
              {t("login.link")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
