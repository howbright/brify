"use client";

import LanguageSelector from "@/components/LanguageSelector";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import "flowbite";

export default function Header() {
  return (
    <header>
      <nav
        id="mainNavbar"
        data-sticky="false"
        className="dark:bg-transparent bg-white border-gray-200 py-2.5 fixed w-full z-40 top-0 start-0 data-[sticky=true]:bg-white data-[sticky=true]:border-b dark:data-[sticky=true]:bg-gray-800 dark:data-[sticky=true]:border-gray-700"
      >
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Brify Logo"
              className="h-8"
              width={100}
              height={100}
            />
          </Link>
          <div className="flex items-center lg:order-2">
            <LanguageSelector />
            {/* 로그인 버튼 */}
            <Link
              href="/login"
              className="text-gray-700 dark:text-white hover:text-primary border border-gray-300 dark:border-gray-600 hover:border-primary focus:ring-primary font-medium rounded-lg text-sm px-4 py-2 mr-2"
            >
              로그인
            </Link>

            {/* 회원가입 버튼 */}
            <Link
              href="/register"
              className="text-white bg-primary hover:bg-primary-dark focus:ring-primary font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary dark:hover:bg-primary-dark focus:outline-none dark:focus:ring-primary"
            >
              회원가입
            </Link>
            <button
              id="mobile-menu-button"
              data-collapse-toggle="mobile-menu-2"
              type="button"
              className="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              aria-controls="mobile-menu-2"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <svg
                className="hidden w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
          <div
            className="hidden justify-between items-center w-full lg:flex lg:w-auto lg:order-1 bg-white dark:bg-gray-800 lg:bg-transparent lg:dark:bg-transparent mt-2 lg:mt-0"
            id="mobile-menu-2"
          >
            <ul className="flex flex-col rounded-lg font-medium lg:flex-row lg:space-x-8">
              <li>
                <Link
                  href="/"
                  className="block py-2 pr-4 pl-3 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                  aria-current="page"
                >
                  홈
                </Link>
              </li>
              <li>
                <Link
                  href="/summarize"
                  className="block py-2 pr-4 pl-3 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  요약하기
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="block py-2 pr-4 pl-3 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  나의요약
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="block py-2 pr-4 pl-3 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  태그
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
