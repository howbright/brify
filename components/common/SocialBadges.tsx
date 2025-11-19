"use client";

import React from "react";

type Props = {
  /** 표시할 배지 텍스트들 */
  items?: string[];
  /** 작게 표시할지 여부 */
  size?: "sm" | "md";
  /** 외부에서 여백/정렬 등을 추가할 때 */
  className?: string;
  /** li/ul로 감싸 a11y 향상 (기본 true) */
  asList?: boolean;
};

function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export default function SocialBadges({
  items = ["타임스탬프 제거", "핵심 트리 생성", "다이어그램 보기", "다국어 지원"],
  size = "sm",
  className = "",
  asList = true,
}: Props) {
  const wrapClass = cx(
    "flex flex-wrap items-center gap-2",
    size === "sm" ? "text-xs" : "text-sm",
    // 기본 텍스트 컬러(다크 모드 가독성 보장)
    "text-neutral-700 dark:text-neutral-200",
    className
  );

  const pillClass = cx(
    "rounded-full border transition-shadow",
    size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5",
    // 라이트: 유리 느낌 / 다크: 은은한 유리 + 가독성 보강
    "bg-white/80 border-white/70",
    "dark:bg-white/12 dark:border-white/20 dark:[text-shadow:0_1px_8px_rgba(0,0,0,0.35)]",
    // 살짝 호버 리프트
    "hover:shadow-sm"
  );

  if (asList) {
    return (
      <ul className={wrapClass} role="list" aria-label="기능 배지">
        {items.map((txt, i) => (
          <li key={i} className="mb-2">
            <span className={pillClass}>{txt}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={wrapClass}>
      {items.map((txt, i) => (
        <span key={i} className={pillClass}>
          {txt}
        </span>
      ))}
    </div>
  );
}
