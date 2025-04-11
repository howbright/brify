"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LoginForm() {
  const t = useTranslations("login");

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3000/auth/callback", // 배포시 도메인에 맞게 수정
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

        {/* 소셜 로그인 버튼 */}
        <div className="flex flex-col space-y-3">
          <Link
            href="#"
            className="flex items-center justify-center w-full border border-gray-900 rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 21 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Google 로고 생략 */}
            </svg>
            {t("google")}
          </Link>

          <Link
            href="#"
            className="group flex items-center justify-center w-full border border-gray-900 rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            <div className="flex gap-x-3 items-center">
              <Icon
                icon="mdi:apple"
                width={27}
                className="text-[#333] hover:text-[#fff] group-hover:text-white transition-colors"
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

        {/* 매직링크 로그인 */}
        <form className="space-y-5" onSubmit={handleLogin}>
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

          <button
            type="submit"
            className="w-full bg-primary hover:scale-105 hover:shadow-lg text-white border rounded-lg py-2.5 text-sm font-bold"
          >
            {t("submit")}
          </button>

          {message && (
            <p className="text-sm text-center text-red-600 dark:text-red-400">
              {message}
            </p>
          )}

          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            {t("signup.question")}{" "}
            <Link
              href="/signup"
              className="font-semibold hover:underline text-black dark:text-white"
            >
              {t("signup.link")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
