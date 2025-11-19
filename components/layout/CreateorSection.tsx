"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type Props = {
  imageSrc?: string; // 예: "/images/creator-brify.png"
  imageAlt?: string;
  name?: string; // 예: "Lina Lee"
  id?: string;
};

export default function CreatorSection({
  imageSrc = "/images/creator-brify.png",
  imageAlt = "Brify 만든 사람",
  name = "Lina Lee",
  id = "about",
}: Props) {
  return (
    <section id={id} className="relative overflow-hidden px-6 md:px-10 py-16">
      {/* —— Light BG layers —— */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-[radial-gradient(1100px_600px_at_50%_-10%,rgb(var(--hero-a,_59,130,246))/_0.18,transparent_60%),radial-gradient(900px_500px_at_50%_110%,rgb(var(--hero-c,_99,102,241))/_0.18,transparent_60%)]
          dark:hidden
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 -z-10
          [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]
          bg-[linear-gradient(to_right,rgba(2,6,23,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(2,6,23,0.06)_1px,transparent_1px)]
          bg-[size:26px_26px]
          dark:hidden
        "
      />

    {/* —— Dark BG layers (reordered & stronger grid) —— */}
{/* 1) Base gradient (맨 아래) */}
<div
  aria-hidden
  className="
    pointer-events-none absolute inset-0 hidden dark:block
    z-[-50]
    bg-[linear-gradient(180deg,#0a0f1c_0%,#05070e_55%,#030408_100%)]
  "
/>

{/* 2) Vignette (중간) */}
<div
  aria-hidden
  className="
    pointer-events-none absolute inset-0 hidden dark:block
    z-[-40]
    bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(0,0,0,0.55),transparent_65%)]
  "
/>

 {/* ✅ 3) Soft glow (여기) */}
 <div
    aria-hidden
    className="
      pointer-events-none absolute inset-0
      z-[-30]
      blur-3xl opacity-35
      bg-[radial-gradient(520px_260px_at_50%_0%,rgba(59,130,246,0.28),transparent),
         radial-gradient(420px_260px_at_50%_100%,rgba(99,102,241,0.28),transparent)]
      hidden dark:block
    "
  />

{/* 3) Grid (맨 위) — 알파 상향 + blend로 대비 확보 */}
<div
  aria-hidden
  className="
    pointer-events-none absolute inset-0 hidden dark:block
    z-[-20]
    bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),
        linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px),
        linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),
        linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)]
    bg-[size:28px_28px,28px_28px,14px_14px,14px_14px]
    mix-blend-screen
    opacity-95
  "
/>



      <div className="max-w-6xl mx-auto">
        {/* 중앙 정렬 클러스터 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45 }}
          className="relative flex flex-col items-center justify-center text-center"
        >
          {/* 아바타 + 캡션 */}
          <div className="flex flex-col items-center shrink-0">
            <div
              className="
                relative rounded-full overflow-hidden
                ring-1 ring-black/5 dark:ring-white/10 shadow-sm
                bg-white/70 dark:bg-black/40 backdrop-blur
                border border-white/60 dark:border-white/10
                w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44
              "
            >
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(min-width: 768px) 176px, 160px"
                className="object-cover"
                priority={false}
              />
            </div>

            {/* 캡션 */}
            <div className="mt-3 text-sm sm:text-base text-neutral-700 dark:text-neutral-300">
              <span className="opacity-80">서비스 만든이 · </span>
              <span className="font-semibold">{name}</span>
            </div>
          </div>

          {/* 말풍선 — 아바타와 밀착 */}
          <div className="-mt-1 sm:-mt-2 relative">
            <div
              className="
      relative mt-4 rounded-3xl px-6 py-5 sm:px-8 sm:py-7
      bg-white/80 backdrop-blur
      border border-white/60 
      shadow-[0_18px_50px_-18px_rgba(15,23,42,0.35)]
      text-neutral-900
      max-w-[68ch]

      /* 🌙 Dark: 더 어둡게 + 유리 톤 */
      dark:bg-[linear-gradient(180deg,rgba(10,15,28,0.70),rgba(10,15,28,0.55))]
      dark:text-neutral-50
      dark:border-white/10
      dark:ring-1 dark:ring-white/5
      dark:backdrop-blur-sm
      dark:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.7)]
    "
            >
              {/* 꼬리 (위쪽 중앙, 배경 톤과 유사하게) */}
              <svg
                aria-hidden
                className="
        absolute left-1/2 -translate-x-1/2 -top-3 h-4 w-6
        text-white/80
        dark:text-[rgba(10,15,28,0.65)]
      "
                viewBox="0 0 24 24"
              >
                <path d="M12 0L24 12H0L12 0Z" fill="currentColor" />
              </svg>

              <p className="text-[17px] leading-8 sm:text-[19px] sm:leading-9 tracking-tight mb-1">
                “볼 것은 많은데 <b>시간은 늘 모자라더군요</b>.<br />
                영상 보며 ‘정말 유익하다’고 느꼈는데, 저녁이면{" "}
                <b>절반도 기억이 나지 않았습니다</b>.<br />‘
                <span className="font-semibold text-blue-700 dark:text-[rgb(var(--hero-b,_99,102,241))]">
                  나중에 봐야지
                </span>
                ’ 하고 미뤘다가 결국 못 본 영상도 적지 않았습니다.
                <br />
                <b>건강</b>과 <b>아이들 교육</b>, <b>재테크</b>까지 챙겨야 할
                것들이 겹치니 더더욱 놓치기 쉬웠습니다.
                <br />
                그래서{" "}
                <b className="font-extrabold">도구를 직접 만들었습니다</b>. 방금
                본 내용을 <b>'구조도'로 정리</b>해 두면, 다시 열어도{" "}
                <b>흐름과 요지</b>가 남습니다.”
              </p>
            </div>
          </div>

          {/* 소프트 글로우 (중앙 집중) */}
          <div
            aria-hidden
            className="pointer-events-none absolute -z-10 inset-0 blur-3xl opacity-35
            bg-[radial-gradient(520px_260px_at_50%_0%,rgba(59,130,246,0.28),transparent),radial-gradient(420px_260px_at_50%_100%,rgba(99,102,241,0.28),transparent)]"
          />
        </motion.div>
      </div>
    </section>
  );
}
