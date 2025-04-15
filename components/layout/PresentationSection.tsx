"use client";

import Image from "next/image";

export default function PresentationSection() {
  return (
    <section className="relative z-10 bg-[#fffdf7] dark:bg-[#1a1a1a] py-20 px-4 border-t border-gray-200 dark:border-white/10">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10">
        {/* ✅ 일러스트 영역 (왼쪽) */}
        <div className="flex-1 flex justify-center">
          <Image
            src="/images/presentation-illustration.png" // ← 여기에 실제 이미지 경로로 바꿔줘!
            alt="프레젠테이션 일러스트"
            width={500}
            height={500}
            className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto"
          />
        </div>

        {/* ✅ 텍스트 영역 (오른쪽) */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 leading-snug">
            <span className="text-primary">프레젠테이션</span>에 <br className="sm:hidden" />
            필수 아이템
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
            다이어그램 기능으로 훌륭한 발표자료를 <strong>수 분 내</strong>에 만드세요.
            <br />
            <strong>Brify</strong>가 당신의 시간을 아껴드립니다.
          </p>
        </div>
      </div>
    </section>
  );
}
