"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function Summarize() {
  const t = useTranslations("HomePage");
  const [showGuide, setShowGuide] = useState(false);

  return (
    <section className="bg-[#f7fbfc] dark:bg-gray-900 min-h-[80vh] flex items-center">
      <div className="py-12 px-6 mx-auto max-w-3xl w-full">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white text-center">
          요약하고 싶은 긴 글을 아래에 붙여넣어주세요.
        </h2>

        {/* 안내 링크 버튼 */}
        <div className="text-right mb-2">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            유튜브 자막 복사 방법이 궁금하신가요?
          </button>
        </div>

        {/* 토글 박스 */}
        {showGuide && (
          <div className="relative mb-6 text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 leading-relaxed">
            {/* 닫기 버튼 */}
            <button
              className="absolute top-3 right-4 text-gray-600 dark:text-gray-300 hover:text-black text-lg"
              onClick={() => setShowGuide(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            🎥 유튜브 영상의 자막을 복사해서 이곳에 붙여넣어 주세요.
            <br />⏱ 영상 중간에 나오는 <strong>시간 표시(예: 00:03:42)</strong>
            는 걱정하지 마세요.
            <br />
            <strong>Brify가 자동으로 처리해드립니다.</strong>
            <br />
            <span className="text-xs italic text-gray-600 dark:text-gray-400 block mt-2">
              유튜브 영상의 스크립트를 보려면 영상 플레이어 하단의 ‘··· 더보기’
              또는 ‘자막 보기’ 메뉴를 눌러주세요. <br />
              복사할 때는 스크립트의 시작 부분을 드래그한 뒤{" "}
              <strong>Shift 키를 누른 채</strong> 스크립트의 마지막 부분을
              클릭하면 전체 선택이 되고, <strong>Ctrl+C (또는 ⌘+C)</strong>로
              복사할 수 있어요.
            </span>
            {/* 튜토리얼 링크 */}
            <div className="mt-4">
              <a
                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" // 여기에 실제 영상 링크를 넣으세요
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
              >
                그래도 모르겠다면? 📺 동영상으로 자세히 안내해드릴게요 →
              </a>
            </div>
          </div>
        )}

        <form action="#">
          <textarea
            id="description"
            name="description"
            rows={16}
            required
            placeholder="예: 유튜브 자막, 블로그 글, 뉴스 기사 등..."
            className="block w-full p-4 text-base text-gray-900 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          ></textarea>

          <div className="flex justify-center mt-10">
            <button
              type="submit"
              className="px-8 py-4 text-lg font-bold text-white bg-primary-500 rounded-xl hover:bg-primary-600 focus:ring-4 focus:ring-primary-200 dark:bg-primary-400 dark:hover:bg-primary-500 dark:focus:ring-primary-600 shadow-lg transition"
            >
              ✨ 요약 시작하기
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
