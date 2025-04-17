"use client";

import Image from "next/image";

export default function KnowledgeCompleteSection() {
  return (
    <section className="relative z-10 bg-linear-to-b from-[#fdf0e6] to-[#fffdf7] py-20 px-4">
      <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-10">
        {/* ✅ 텍스트 영역 */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 leading-snug">
            이제부터는 <span className="text-primary">지식을 완성</span>하세요
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
            읽기 시작하는 건 쉽지만 끝까지 정리하긴 어렵죠?
            <br />
            <strong>Brify</strong>는 핵심 정리로 당신의 지식이 완성되도록 돕습니다.
          </p>
        </div>

        {/* ✅ 일러스트 영역 */}
        <div className="flex-1 flex justify-center">
          <Image
            src="/images/knowledge-complete.png"
            alt="지식을 완성하는 일러스트"
            width={500}
            height={500}
            className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto"
          />
        </div>
      </div>
    </section>
  );
}
