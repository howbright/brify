import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-[#fefefe] text-[#1f1f1f] dark:bg-[#111827] dark:text-white py-28 px-4">
      <div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-10">
        {/* 헤드라인 */}
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
          긴 글, 긴 영상도
          <br />
          <span className="bg-gradient-to-r from-[#ff6b6b] via-[#fcb045] to-[#6366f1] bg-clip-text text-transparent">
            Brify가 요점만 딱!
          </span>
        </h1>

        {/* 설명 */}
        <p className="text-lg md:text-xl leading-relaxed max-w-3xl text-[#444] dark:text-gray-300">
          블로그, 뉴스, 논문, 유튜브까지 —<br />
          <span className="font-semibold">
            Brify가 AI로 대신 읽고 요약해드립니다.
          </span>
          <br />
          <span className="mt-4 inline-block">
            ⏱ <strong className="text-[#ff6b6b]">시간 절약</strong>, 📚{" "}
            <strong className="text-[#fcb045]">지식 완성</strong>, 🎯{" "}
            <strong className="text-[#6366f1]">정확한 선택</strong>
          </span>
        </p>

        {/* 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          {/* 검은색 버튼 유지 */}
          <Link
            href="/summarize"
            className="px-8 py-4 text-lg font-semibold rounded-xl bg-[#1f1f1f] text-white hover:bg-[#333] transition"
          >
            ✨ 지금 요약해보기
          </Link>
          {/* 검은색 테두리 버튼 유지 */}
          <Link
            href="/guide"
            className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-[#1f1f1f] text-[#1f1f1f] hover:bg-[#f3f4f6] transition dark:border-white dark:text-white dark:hover:bg-[#1f1f1f]"
          >
            🎥 사용 가이드 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
