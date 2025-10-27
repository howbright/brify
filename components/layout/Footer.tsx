"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[color:var(--glass-border)] bg-[var(--glass)] backdrop-blur theme-fade text-sm text-[var(--color-muted-foreground)] px-6 md:px-10 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* 브랜드 / 사업자 정보 */}
        <div>
          <h3 className="text-base font-semibold mb-3 text-[var(--color-primary-600)]">vision328</h3>
          <p className="mb-1 text-[var(--color-foreground)]">대표: 이나현</p>
          <p className="mb-1 text-[var(--color-foreground)]">사업자등록번호: 123-45-67890</p>
          <p className="mb-1 text-[var(--color-foreground)]">통신판매업신고: 2025-서울강남-0123</p>
          <p className="mt-2 text-xs">
            <span className="text-[var(--color-primary-600)] font-semibold">Brify</span>는 vision328이 운영하는 서비스입니다.
          </p>
        </div>

        {/* 연락처 */}
        <div>
          <h3 className="text-base font-semibold mb-3 text-[var(--color-primary-600)]">Contact</h3>
          <p className="mb-1 text-[var(--color-foreground)]">이메일: contact@brify.ai</p>
          <p className="text-xs">※ 주소 및 전화번호는 개인정보 보호를 위해 공개하지 않습니다.</p>
        </div>

        {/* 서비스 링크 */}
        <div>
          <h3 className="text-base font-semibold mb-3 text-[var(--color-primary-600)]">서비스</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/summarize" className="hover:underline hover:text-[var(--color-primary-600)] transition-colors text-[var(--color-foreground)]">
                핵심정리하기
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:underline hover:text-[var(--color-primary-600)] transition-colors text-[var(--color-foreground)]">
                요금제
              </Link>
            </li>
            <li>
              <Link href="/my-summaries" className="hover:underline hover:text-[var(--color-primary-600)] transition-colors text-[var(--color-foreground)]">
                나의 스크랩북
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:underline hover:text-[var(--color-primary-600)] transition-colors text-[var(--color-foreground)]">
                계정 설정
              </Link>
            </li>
          </ul>
        </div>

        {/* 정책/기타 */}
        <div>
          <h3 className="text-base font-semibold mb-3 text-[var(--color-primary-600)]">기타</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/terms" className="hover:underline hover:text-[var(--color-primary-600)] transition-colors text-[var(--color-foreground)]">
                이용약관
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:underline hover:text-[var(--color-primary-600)] transition-colors text-[var(--color-foreground)]">
                개인정보처리방침
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:underline hover:text-[var(--color-primary-600)] transition-colors text-[var(--color-foreground)]">
                고객지원
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* 하단 바 */}
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[color:var(--glass-border)] text-center text-xs">
        © {new Date().getFullYear()} vision328. All rights reserved.
      </div>
    </footer>
  );
}
