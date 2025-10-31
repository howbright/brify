// components/layout/Footer.tsx
"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="
        border-t border-[color:var(--glass-border)]
        /* Light: 약간의 유리감 */
        bg-white/70 supports-[backdrop-filter]:bg-white/60 backdrop-blur

        /* Dark: 불투명(or 거의 불투명) 단색으로 먼저 눌러주기 */
               /* ✅ 진한 네이비 단색 */
        dark:bg-[#0b1224]
        dark:border-white/10
        dark:text-neutral-300

        text-sm px-6 md:px-10 py-12
      "
    >
      {/* 내부에만 약한 글래스 베일 (선택) */}
      <div className="
        mx-auto max-w-7xl
        /* 라이트는 거의 영향 없음 */
        supports-[backdrop-filter]:bg-white/0
        rounded-2xl
        p-0
      ">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* 브랜드 / 사업자 정보 */}
          <div>
            <h3 className="text-base font-semibold mb-3 text-[var(--color-primary-600)] dark:text-white">
              vision328
            </h3>
            <p className="mb-1 text-[var(--color-foreground)] dark:text-neutral-200">대표: 이나현</p>
            <p className="mb-1 text-[var(--color-foreground)] dark:text-neutral-200">사업자등록번호: 123-45-67890</p>
            <p className="mb-1 text-[var(--color-foreground)] dark:text-neutral-200">통신판매업신고: 2025-서울강남-0123</p>
            <p className="mt-2 text-xs">
              <span className="text-[var(--color-primary-600)] font-semibold dark:text-[rgb(var(--hero-b))]">
                Brify
              </span>
              는 vision328이 운영하는 서비스입니다.
            </p>
          </div>

          {/* 연락처 */}
          <div>
            <h3 className="text-base font-semibold mb-3 text-[var(--color-primary-600)] dark:text-white">Contact</h3>
            <p className="mb-1 text-[var(--color-foreground)] dark:text-neutral-200">이메일: contact@brify.ai</p>
            <p className="text-xs">※ 주소 및 전화번호는 개인정보 보호를 위해 공개하지 않습니다.</p>
          </div>

          {/* 서비스 링크 */}
          <div>
            <h3 className="text-base font-semibold mb-3 text-[var(--color-primary-600)] dark:text-white">서비스</h3>
            <ul className="space-y-1">
              {[
                { href: "/summarize", label: "핵심정리하기" },
                { href: "/pricing", label: "요금제" },
                { href: "/my-summaries", label: "나의 스크랩북" },
                { href: "/account", label: "계정 설정" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="
                      transition-colors hover:underline
                      text-[var(--color-foreground)] hover:text-[var(--color-primary-600)]
                      dark:text-neutral-100 dark:hover:text-[rgb(var(--hero-b))]
                    "
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 정책/기타 */}
          <div>
            <h3 className="text-base font-semibold mb-3 text-[var(--color-primary-600)] dark:text-white">기타</h3>
            <ul className="space-y-1">
              {[
                { href: "/terms", label: "이용약관" },
                { href: "/privacy", label: "개인정보처리방침" },
                { href: "/support", label: "고객지원" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="
                      transition-colors hover:underline
                      text-[var(--color-foreground)] hover:text-[var(--color-primary-600)]
                      dark:text-neutral-100 dark:hover:text-[rgb(var(--hero-b))]
                    "
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 하단 바 */}
        <div
          className="
            max-w-7xl mx-auto mt-10 pt-6
            border-t border-[color:var(--glass-border)]
            dark:border-white/10
            text-center text-xs
            text-[var(--color-muted-foreground)] dark:text-neutral-400
          "
        >
          © {new Date().getFullYear()} vision328. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
