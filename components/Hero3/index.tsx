import Link from "next/link";

export default function Hero3() {
  return (
    <section className="relative bg-[#f4f7f8] text-[#1f1f1f] dark:bg-[#111827] dark:text-white py-28 px-4 overflow-hidden">
      {/* 🎨 배경 SVGs */}
      <img
        src="/images/hero1.svg"
        alt=""
        className="absolute top-[-20px] left-[-20px] w-28 md:w-36 opacity-40 animate-floating pointer-events-none"
        aria-hidden="true"
      />
      <img
        src="/images/hero2.svg"
        alt=""
        className="absolute bottom-[-30px] right-[-20px] w-32 md:w-40 opacity-40 animate-floating-reverse pointer-events-none"
        aria-hidden="true"
      />
      <img
        src="/images/hero3.svg"
        alt=""
        className="absolute top-[-30px] right-8 w-24 md:w-32 opacity-30 rotate-12 pointer-events-none"
        aria-hidden="true"
      />
      <img
        src="/images/hero5.svg"
        alt=""
        className="absolute bottom-[-20px] left-6 w-20 md:w-28 opacity-30 pointer-events-none"
        aria-hidden="true"
      />

      {/* 🧠 콘텐츠 */}
      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-10">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
          긴 글, 긴 영상도
          <br />
          <span className="bg-gradient-to-r from-[#0ea5e9] via-[#3b82f6] to-[#6366f1] bg-clip-text text-transparent">
            Brify가 요점만 딱!
          </span>
        </h1>

        <p className="text-lg md:text-xl leading-relaxed max-w-3xl text-[#444] dark:text-gray-300">
          블로그, 뉴스, 논문, 유튜브까지 —<br />
          <span className="font-semibold">
            Brify가 AI로 대신 읽고 요약해드립니다.
          </span>
          <br />
          <span className="mt-4 inline-block">
            ⏱ <strong className="text-[#0ea5e9]">시간 절약</strong>, 📚{" "}
            <strong className="text-[#3b82f6]">지식 완성</strong>, 🎯{" "}
            <strong className="text-[#6366f1]">정확한 선택</strong>
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
          <Link
            href="/summarize"
            className="px-8 py-4 text-lg font-semibold rounded-xl bg-[#1f1f1f] text-white hover:bg-[#333] transition"
          >
            ✨ 지금 요약해보기
          </Link>
          <Link
            href="/guide"
            className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-[#1f1f1f] text-[#1f1f1f] hover:bg-[#e5e7eb] transition dark:border-white dark:text-white dark:hover:bg-[#1f1f1f]"
          >
            🎥 사용 가이드 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
