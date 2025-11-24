"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import { useTranslations } from "next-intl";

type ScriptHelpSectionProps = {
  isHelpOpen: boolean;
  onToggle: () => void;
};

export default function ScriptHelpSection({
  isHelpOpen,
  onToggle,
}: ScriptHelpSectionProps) {
  const t = useTranslations("ScriptHelpSection");

  return (
    <section
      className={`
        rounded-3xl border border-neutral-200 bg-white
        shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]
        backdrop-blur-sm
        dark:bg-[#020818] dark:border-white/15
        transition-all duration-300 ease-out
        ${isHelpOpen ? "p-4 md:p-5" : "p-3 md:p-3.5"}
      `}
    >
      {/* 헤더: 항상 보이는 영역 (뱃지 + 타이틀 + 한 줄 요약 + 아이콘) */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={isHelpOpen}
      >
        <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
          <span className="text-[11px] px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:border-[rgb(var(--hero-b))]/40 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
            {t("badge")}
          </span>
          <h2
            className="
              text-sm md:text-base font-semibold text-neutral-900 dark:text-white
              whitespace-normal md:whitespace-wrap
            "
          >
            {t("headerTitle")}
          </h2>
          <p className="text-[13px] md:text-sm text-neutral-500 dark:text-neutral-400">
            {t("headerSubtitle")}
          </p>
        </div>

        <Icon
          icon="mdi:chevron-down"
          className={`
            h-5 w-5 shrink-0
            transition-transform duration-200 ease-out
            ${isHelpOpen ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* 토글되는 본문 래퍼: 높이 애니메이션 + 잘림 담당 */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isHelpOpen ? "mt-4 max-h-[520px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        {/* 실제 스크롤이 생기는 영역 */}
        <div className="max-h-[380px] md:max-h-[430px] overflow-y-auto pr-1">
          <div className="flex flex-col gap-5 text-[13px] md:text-sm text-neutral-700 dark:text-neutral-200">
            {/* 블럭 A: YouTube에서 스크립트 가져오기 */}
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-sm md:text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                  {t("sectionA.title")}
                </h3>
                <p className="mt-1 text-[13px] md:text-sm text-neutral-500 dark:text-neutral-400">
                  {t("sectionA.description")}
                </p>
              </div>

              {/* Step 1 */}
              <div className="flex gap-3 md:gap-4 items-start">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700  dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
                  1
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                    {t("step1.title")}
                  </p>
                  <p className="text-[13px] md:text-sm text-neutral-600 dark:text-neutral-400">
                    {t("step1.body")}
                  </p>
                  <div className="mt-1 overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-white/15 bg-neutral-50/60 dark:bg-black/40">
                    <Image
                      src="/images/help/youtube-step1-watch-page.png"
                      alt={t("step1.imageAlt")}
                      width={640}
                      height={360}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3 md:gap-4 items-start">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
                  2
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                    {t("step2.title")}
                  </p>
                  <p className="text-[13px] md:text-sm text-neutral-600 dark:text-neutral-400">
                    {t("step2.body")}
                  </p>
                  <div className="mt-1 overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-white/15 bg-neutral-50/60 dark:bg-black/40">
                    <Image
                      src="/images/help/youtube-step2-menu.png"
                      alt={t("step2.imageAlt")}
                      width={640}
                      height={360}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3 md:gap-4 items-start">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
                  3
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                    {t("step3.title")}
                  </p>

                  {/* 🔹 형광펜 느낌 하이라이트 박스 */}
                  <div
                    className="
                      mt-1 rounded-2xl border border-amber-100 bg-amber-50/80
                      px-3 py-2.5
                      shadow-[0_12px_30px_-24px_rgba(180,83,9,0.9)]
                      flex flex-col gap-1
                      text-[13px] md:text-sm text-neutral-700
                      dark:border-amber-400/60 dark:bg-amber-500/10 dark:text-neutral-200
                    "
                  >
                    <p>{t("step3.tip1")}</p>
                    <p>
                      {t("step3.tip2Part1")}{" "}
                      <span
                        className="
                          relative inline-block px-1 rounded
                          bg-amber-200/70 dark:bg-amber-400/40
                          font-semibold
                        "
                      >
                        {t("step3.tip2Highlight")}
                      </span>{" "}
                      {t("step3.tip2Part2")}
                    </p>
                    <p>{t("step3.tip3")}</p>
                    <p className="mt-1 text-[12px] md:text-[13px] text-neutral-600 dark:text-neutral-300">
                      {t("step3.tipNote")}
                    </p>
                  </div>

                  <div className="mt-1 overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-white/15 bg-neutral-50/60 dark:bg-black/40">
                    <Image
                      src="/images/help/youtube-step3-transcript.png"
                      alt={t("step3.imageAlt")}
                      width={640}
                      height={360}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3 md:gap-4 items-start">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
                  4
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                    {t("step4.title")}
                  </p>
                  <p className="text-[13px] md:text-sm text-neutral-600 dark:text-neutral-400">
                    {t("step4.body")}
                  </p>
                  <div className="mt-1 overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-white/15 bg-neutral-50/60 dark:bg-black/40">
                    <Image
                      src="/images/help/youtube-step4-paste.png"
                      alt={t("step4.imageAlt")}
                      width={640}
                      height={160}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-neutral-200/80 dark:bg-white/10" />

            {/* 블럭 B: 자막 파일 / 편집툴 / 이미 있는 스크립트 */}
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-sm md:text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                  {t("sectionB.title")}
                </h3>
                <p className="mt-1 text-[13px] md:text-sm text-neutral-500 dark:text-neutral-400">
                  {t("sectionB.description")}
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* 케이스 1 */}
                <div className="flex gap-2.5 items-start">
                  <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-100">
                    ①
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[12px] md:text-[13px] text-neutral-900 dark:text-neutral-50">
                      {t("case1.title")}
                    </p>
                    <p className="mt-0.5 text-[13px] md:text-sm text-neutral-600 dark:text-neutral-400">
                      {t("case1.body")}
                    </p>
                  </div>
                </div>

                {/* 케이스 2 */}
                <div className="flex gap-2.5 items-start">
                  <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-100">
                    ②
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[12px] md:text-[13px] text-neutral-900 dark:text-neutral-50">
                      {t("case2.title")}
                    </p>
                    <p className="mt-0.5 text-[13px] md:text-sm text-neutral-600 dark:text-neutral-400">
                      {t("case2.body")}
                    </p>
                  </div>
                </div>

                {/* 케이스 3 */}
                <div className="flex gap-2.5 items-start">
                  <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-100">
                    ③
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[12px] md:text-[13px] text-neutral-900 dark:text-neutral-50">
                      {t("case3.title")}
                    </p>
                    <p className="mt-0.5 text-[13px] md:text-sm text-neutral-600 dark:text-neutral-400">
                      {t("case3.body")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 구분선 (얇게) */}
            <div className="h-px bg-neutral-200/60 dark:bg-white/10" />

            {/* 블럭 C: 작은 FAQ / 팁 */}
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-3 text-[13px] md:text-sm text-neutral-700 dark:border-white/15 dark:bg-white/5 dark:text-neutral-200">
              <p className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                {t("faq.title")}
              </p>
              <ul className="list-disc list-inside flex flex-col gap-0.5">
                <li>{t("faq.item1")}</li>
                <li>{t("faq.item2")}</li>
                <li>{t("faq.item3")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
