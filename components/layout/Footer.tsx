"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4 text-sm text-text bg-background-soft">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-base font-semibold mb-3 text-primary">
            vision328
          </h3>
          <p className="mb-1">대표: 이나현</p>
          <p className="mb-1">사업자등록번호: 123-45-67890</p>
          <p className="mb-1">통신판매업신고: 2025-서울강남-0123</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="text-primary font-semibold">Brify</span>는 vision328이 운영하는 서비스입니다.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3 text-primary">
            Contact
          </h3>
          <p className="mb-1">이메일: contact@brify.ai</p>
          <p className="text-xs text-muted-foreground">
            ※ 주소 및 전화번호는 개인정보 보호를 위해 공개하지 않습니다.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3 text-primary">
            서비스
          </h3>
          <ul className="space-y-1">
            <li>
              <Link href="/summarize" className="hover:underline hover:text-primary transition-colors">
                핵심정리하기
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:underline hover:text-primary transition-colors">
                요금제
              </Link>
            </li>
            <li>
              <Link href="/my" className="hover:underline hover:text-primary transition-colors">
                나의 정리
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:underline hover:text-primary transition-colors">
                계정 설정
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3 text-primary">
            기타
          </h3>
          <ul className="space-y-1">
            <li>
              <Link href="/terms" className="hover:underline hover:text-primary transition-colors">
                이용약관
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:underline hover:text-primary transition-colors">
                개인정보처리방침
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:underline hover:text-primary transition-colors">
                고객지원
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-muted-foreground">
        © 2025 vision328. All rights reserved.
      </div>
    </footer>
  );
}
