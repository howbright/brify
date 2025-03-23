'use client';

import { Link } from "@/i18n/navigation";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#fefefe] dark:bg-[#111827] bg-opacity-90 backdrop-blur-md shadow-sm transition-all">
      <nav className="max-w-screen-xl mx-auto px-4 lg:px-6 py-3 flex justify-between items-center">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.svg" alt="Brify Logo" className="h-8" />
        </Link>

        {/* 데스크탑 내비게이션 */}
        <div className="hidden lg:flex items-center space-x-8 font-medium text-sm">
          <Link href="/" className="hover:text-[#3b82f6] transition">홈</Link>
          <Link href="/summarize" className="hover:text-[#3b82f6] transition">요약하기</Link>
          <Link href="#" className="hover:text-[#3b82f6] transition">모아보기</Link>
          <Link href="#" className="hover:text-[#3b82f6] transition">태그</Link>
        </div>

        {/* 로그인 / 회원가입 버튼 */}
        <div className="flex items-center space-x-2">
          {/* 로그인 */}
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-primary dark:text-white border border-primary dark:border-white bg-white dark:bg-transparent rounded-md transition-all duration-300 hover:rounded-full"
          >
            로그인
          </Link>

          {/* 회원가입 */}
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-white dark:text-primary rounded-md transition-all duration-300 hover:rounded-full"
          >
            회원가입
          </Link>
        </div>
      </nav>
    </header>
  );
}
