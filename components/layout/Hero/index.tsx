import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f8ff] to-[#e8f6f1] dark:from-gray-900 dark:to-gray-800">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/hero-bg.svg"
          alt=""
          className="w-full h-full object-cover opacity-50"
          aria-hidden="true"
          fill
        />
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10 py-24 px-4 mx-auto max-w-6xl text-center lg:px-12">
        {/* 메인 문구 */}
        <h1 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
          긴 글, 긴 영상
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400">
            Brify가 요점만 딱!
          </span>
        </h1>

        {/* 설명 문구 */}
        <p className="mb-12 text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          읽기 힘든 블로그, 뉴스, 논문, 유튜브 영상까지—
          <span className="block font-medium text-gray-900 dark:text-white mt-2">
            Brify가 AI로 대신 읽고 정리해드립니다.
          </span>
          <span className="block mt-4">
            복사만 하세요. Brify는{" "}
            <strong className="text-sky-600">시간을 아끼고</strong>,{" "}
            <strong className="text-emerald-600">지식을 완성</strong>하며,{" "}
            <strong className="text-blue-600">정확한 선택</strong>을 돕습니다.
          </span>
        </p>

        {/* CTA 버튼들 */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/summarize"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400 rounded-2xl shadow-xl transition hover:scale-105 hover:shadow-2xl hover:from-blue-600 hover:to-emerald-500 focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-800"
          >
            ✨ 지금 요약해보기
          </Link>
          <Link
            href="/guide"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-900 bg-white border border-gray-300 rounded-2xl hover:bg-gray-100 dark:text-white dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 transition hover:scale-105"
          >
            🎥 사용 가이드 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
