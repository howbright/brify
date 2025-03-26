"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import GradientButton from "@/components/ui/GradientButton";
import LoginPromptModal from "@/components/LoginPopupModal";

export default function Summarize() {
  // const t = useTranslations("HomePage");
  const [showGuide, setShowGuide] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleStartSummary = () => {
    // 비회원이라면 팝업 열기
    setShowModal(true);
  };

  const onSubmit = () => {};

  return (
    <section className="bg-[#f7f9fa] dark:bg-[#111827] min-h-[80vh] mt-10 flex items-center">
      {/* 팝업 모달 */}
      <LoginPromptModal show={showModal} onClose={() => setShowModal(false)} />

      <div className="py-20 px-6 mx-auto max-w-3xl w-full">
        {/* 헤딩 */}
        <h2 className="mb-10 text-3xl font-black text-center tracking-tight">
          요약하고 싶은 긴 글을 아래에 붙여넣어주세요
        </h2>

        {/* 토글 안내 버튼 */}
        <div className="text-right mb-4">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-sm font-medium underline underline-offset-2 text-accent-blue hover:text-primary transition"
          >
            유튜브 자막 복사 방법이 궁금하신가요?
          </button>
        </div>

        {/* 안내 박스 */}
        {showGuide && (
          <div className="relative mb-8 p-4 border-2 border-primary rounded-lg bg-white dark:bg-gray-900 text-sm leading-relaxed">
            <button
              className="absolute top-3 right-4 font-bold text-lg hover:text-red-600"
              onClick={() => setShowGuide(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            <p>
              🎥 유튜브 영상 자막을 복사해서 이곳에 붙여넣어 주세요.
              <br />⏱ <strong>시간 표시</strong>(예: 00:03:42)는 자동으로
              제거됩니다.
              <br />
              <strong>Brify가 자동으로 처리해드려요.</strong>
            </p>
            <p className="text-xs italic mt-2 text-gray-600 dark:text-gray-400">
              자막 복사 팁: ‘··· 더보기’ 또는 ‘자막 보기’ 메뉴 → 시작부터 끝까지
              Shift 클릭 → Ctrl+C 또는 ⌘+C
            </p>
            <div className="mt-3">
              <Link
                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline text-accent-blue hover:text-primary"
              >
                📺 동영상으로 자세히 안내 보기 →
              </Link>
            </div>
          </div>
        )}

        {/* 입력 폼 */}
        <form action="#">
          <div className="group relative rounded-xl bg-gray-300 transition-all duration-300 hover:bg-gradient-to-r hover:from-accent-blue hover:via-accent-indigo hover:to-accent-sky animate-gradient-x p-[2px]">
            <div className="bg-gray-soft dark:bg-gray-800 rounded-[10px]">
              <textarea
                id="description"
                name="description"
                rows={16}
                required
                placeholder="예: 유튜브 자막, 블로그 글, 뉴스 기사 등..."
                className="w-full h-full p-6 text-base font-mono rounded-[10px] 
    bg-white dark:bg-gray-100
    text-black dark:text-gray-900 
    placeholder-gray-500 dark:placeholder-gray-600
    border-none outline-none focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-center mt-10">
            <GradientButton
              label={"✨ 요약 시작하기"}
              type="submit"
              onClick={handleStartSummary}
            />
          </div>
        </form>
      </div>
    </section>
  );
}
