import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="py-16 px-4 mx-auto max-w-screen-xl text-center lg:py-24 lg:px-12">
        
        {/* 상단 New 배지 */}
        <Link
          href="/update"
          className="group inline-flex items-center justify-between gap-2 py-1 pl-3 pr-4 mb-7 text-sm bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-700 transition"
        >
          <span className="text-xs font-semibold bg-primary-600 text-white px-3 py-1 rounded-full">
            New
          </span>
          <span className="font-medium">Brify 업데이트 보러가기</span>
          <svg
            className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 010-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </Link>

        {/* 메인 문구 */}
        <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
          읽지 말고, <span className="text-primary-600">이해하세요.</span>
          <br />
          Brify, AI 리딩 어시스턴트
        </h1>

        {/* 설명 문구 */}
        <p className="mb-10 text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          너무 길어서 읽기 힘든 블로그, 뉴스, 논문, 유튜브 영상 스크립트까지,<br />
          <span className="font-medium text-gray-900 dark:text-white">Brify가 AI로 대신 읽고 정리해드립니다.</span><br />
          복사만 하세요. Brify는 당신의 <strong className="text-primary-600">시간을 아끼고,</strong> <strong className="text-primary-600">지식을 완성</strong>하며, <strong className="text-primary-600">정확한 선택</strong>을 돕습니다.
        </p>

        {/* CTA 버튼들 */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/summarize"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary-700 rounded-xl hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900 transition"
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
