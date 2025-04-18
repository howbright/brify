"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-white/10 py-12 px-4 text-sm text-gray-600 dark:text-gray-400 bg-[#f8f9fb] dark:bg-[#0e0e16]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-white">
            vision328
          </h3>
          <p className="mb-1">대표: 이나현</p>
          <p className="mb-1">사업자등록번호: 123-45-67890</p>
          <p className="mb-1">통신판매업신고: 2025-서울강남-0123</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
            Brify는 vision328이 운영하는 서비스입니다.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-white">
            Contact
          </h3>
          <p className="mb-1">이메일: contact@brify.ai</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            ※ 주소 및 전화번호는 개인정보 보호를 위해 공개하지 않습니다.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-white">
            서비스
          </h3>
          <ul className="space-y-1">
            <li>
              <Link href="/summarize" className="hover:underline">
                핵심정리하기
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:underline">
                요금제
              </Link>
            </li>
            <li>
              <Link href="/my" className="hover:underline">
                나의 정리
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:underline">
                계정 설정
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-white">
            기타
          </h3>
          <ul className="space-y-1">
            <li>
              <Link href="/terms" className="hover:underline">
                이용약관
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:underline">
                개인정보처리방침
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:underline">
                고객지원
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-gray-400">
        © 2025 vision328. All rights reserved.
      </div>
    </footer>
  );
}
