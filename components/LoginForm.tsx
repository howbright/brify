"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";

export default function LoginForm() {
  const t = useTranslations("login");

  return (
    <div className="w-full col-span-6 mx-auto border border-gray-900 dark:border-white/20 bg-white dark:bg-black rounded-lg shadow-lg sm:max-w-lg">
      <div className="p-6 sm:p-8 space-y-6">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          {t("title")}
        </h1>

        {/* 소셜 로그인 버튼 */}
        <div className="flex flex-col space-y-3">
          {/* Google */}
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
              <g clipPath="url(#clip0)">
                <path
                  d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H10.7031V12.0492H16.1046C15.8804 13.2911 15.1602 14.3898 14.1057 15.0879V17.5866H17.3282C19.2205 15.8449 20.3081 13.2728 20.3081 10.2303Z"
                  fill="#3F83F8"
                />
                <path
                  d="M10.7019 20.0006C13.3989 20.0006 15.6734 19.1151 17.3306 17.5865L14.1081 15.0879C13.2115 15.6979 12.0541 16.0433 10.7056 16.0433C8.09669 16.0433 5.88468 14.2832 5.091 11.9169H1.76562V14.4927C3.46322 17.8695 6.92087 20.0006 10.7019 20.0006V20.0006Z"
                  fill="#34A853"
                />
                <path
                  d="M5.08857 11.9169C4.66969 10.6749 4.66969 9.33008 5.08857 8.08811V5.51233H1.76688C0.348541 8.33798 0.348541 11.667 1.76688 14.4927L5.08857 11.9169V11.9169Z"
                  fill="#FBBC04"
                />
                <path
                  d="M10.7019 3.95805C12.1276 3.936 13.5055 4.47247 14.538 5.45722L17.393 2.60218C15.5852 0.904587 13.1858 -0.0287217 10.7019 0.000673888C6.92087 0.000673888 3.46322 2.13185 1.76562 5.51234L5.08732 8.08813C5.87733 5.71811 8.09302 3.95805 10.7019 3.95805V3.95805Z"
                  fill="#EA4335"
                />
              </g>
              <defs>
                <clipPath id="clip0">
                  <rect
                    width="20"
                    height="20"
                    fill="white"
                    transform="translate(0.5)"
                  />
                </clipPath>
              </defs>
            </svg>
            {t("google")}
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
            className="w-full bg-primary hover:scale-105 hover:shadow-lg text-white border rounded-lg py-2.5 text-sm font-bold"
          >
            {t("submit")}
          </button>
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
