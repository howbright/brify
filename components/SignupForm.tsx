"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";

export default function SignupForm() {
  const t = useTranslations("signup");

  return (
    <div className="w-full col-span-6 mx-auto border border-gray-900 dark:border-white/20 bg-white dark:bg-black rounded-lg shadow-lg sm:max-w-lg">
      <div className="p-6 sm:p-8 space-y-6">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          {t("title")}
        </h1>

        {/* 소셜 가입 버튼 */}
        <div className="flex flex-col space-y-3">
          {/* Google */}
          <Link
            href="#"
            className="flex items-center justify-center w-full border border-gray-900 rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            <div className="flex gap-x-3 items-center">
              <Icon icon="logos:google-icon" width={19} />
              <span>{t("google")}</span>
            </div>
          </Link>

          {/* Apple */}
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

        {/* 매직링크 이메일 입력 */}
        <form className="space-y-5" action="#">
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium">
              {t("email.label")}
            </label>
            <input
              type="email"
              id="email"
              placeholder={t("email.placeholder")}
              className="w-full border border-gray-900 rounded-lg p-2.5 bg-white dark:bg-black dark:border-white/20 focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white border border-gray-900 rounded-lg py-2.5 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors"
          >
            {t("submit")}
          </button>

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
