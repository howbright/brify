import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f7f9fb] to-[#e4e9f0] dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/hero-bg.svg"
          alt=""
          className="w-full h-full object-cover opacity-60"
          aria-hidden="true"
        />
      </div>
      <div className="py-16 px-4 z-10 mx-auto max-w-screen-xl text-center lg:py-24 lg:px-12">
        {/* 메인 문구 */}
        <h1 className="mb-10 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-10 tracking-tight text-gray-900 dark:text-white">
          긴 글, 긴 영상
          <br />
          <span className="text-primary-600">Brify가 요점만 딱!</span>
        </h1>

        {/* 설명 문구 */}
        <p className="mb-10 text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          너무 길어서 읽기 힘든 블로그, 뉴스, 논문, 유튜브 영상 스크립트까지,
          <br />
          <span className="font-medium text-gray-900 dark:text-white">
            Brify가 AI로 대신 읽고 정리해드립니다.
          </span>
          <br />
          복사만 하세요. Brify는 당신의{" "}
          <strong className="text-primary-600">시간을 아끼고,</strong>{" "}
          <strong className="text-primary-600">지식을 완성</strong>하며,{" "}
          <strong className="text-primary-600">정확한 선택</strong>을 돕습니다.
        </p>

        {/* CTA 버튼들 */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/summarize"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 shadow-lg transition"
          >
            ✨ 지금 요약해보기
          </Link>
          <Link
            href="/guide"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-900 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 dark:text-white dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 transition"
          >
            🎥 사용 가이드 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
