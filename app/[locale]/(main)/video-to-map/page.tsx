"use client";

import { useEffect, useState } from "react";

const CREDITS_PER_RUN = 3; // 한 번 실행 시 소모 크레딧

export default function VideoToMapPage() {
  const [scriptText, setScriptText] = useState("");
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusStep, setStatusStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null); // TODO: 구조맵 결과 타입으로 변경
  const [isHelpOpen, setIsHelpOpen] = useState(false); // 🔹 도움말 토글 상태

  const statusMessages = [
    "영상 내용을 읽고 있어요...",
    "큰 흐름을 먼저 나누는 중이에요...",
    "핵심 키워드를 추려내는 중이에요...",
    "구조도로 배치하고 있어요...",
    "조금만 더 기다려 주세요!",
  ];

  useEffect(() => {
    if (!isProcessing) {
      setStatusStep(0);
      return;
    }

    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % statusMessages.length;
      setStatusStep(step);
    }, 2500);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleClickGenerate = () => {
    setError(null);
    if (!scriptText.trim()) {
      setError("먼저 영상 스크립트를 아래에 붙여넣어 주세요.");
      return;
    }
    setShowCreditDialog(true);
  };

  const handleConfirmUseCredits = async () => {
    setShowCreditDialog(false);
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // TODO: 실제 백엔드 API 경로로 변경
      const res = await fetch("/api/video-to-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: scriptText }),
      });

      if (!res.ok) {
        throw new Error(
          "서버 요청에 실패했습니다. 잠시 후 다시 시도해 주세요."
        );
      }

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main
      className="
        pt-16 pb-16 min-h-screen w-full relative
        bg-[#f4f6fb] dark:bg-[#020617]
        text-neutral-900 dark:text-neutral-50
      "
    >
      {/* 상단만 살짝 블루 톤 그라데이션 + 아주 약한 그리드 */}
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 h-72 -z-10
          bg-[radial-gradient(900px_380px_at_20%_0%,rgb(var(--hero-a)_/_0.16),transparent_65%),radial-gradient(900px_380px_at_80%_0%,rgb(var(--hero-b)_/_0.14),transparent_65%)]
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          [mask-image:linear-gradient(to_bottom,black,transparent_70%)]
          bg-[linear-gradient(to_right,rgb(var(--hero-grid)_/_0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--hero-grid)_/_0.035)_1px,transparent_1px)]
          bg-[size:26px_26px]
          opacity-60
          dark:opacity-30
        "
      />

      <div className="max-w-6xl mx-auto px-6 md:px-10 flex flex-col gap-10 relative">
        {/* 상단 헤더 / 상세 기능 페이지 느낌 */}
        <header className="mt-2 flex flex-col gap-4">
          {/* <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-medium text-blue-700 shadow-sm backdrop-blur-sm dark:border-white/20 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500/80 dark:bg-[rgb(var(--hero-b))]" />
            Video to Map · 영상 스크립트 구조맵
          </div> */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.45)]">
            영상 스크립트,{" "}
            <span className="text-blue-700 dark:text-[rgb(var(--hero-b))]">
              구조도로 자동 변환해요
            </span>
          </h1>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-2xl">
            유튜브/강의/설교 영상의 스크립트를{" "}
            <span className="font-semibold text-neutral-900 dark:text-neutral-50">
              그대로 붙여넣기만 하시면,
            </span>{" "}
            흐름과 계층 구조까지 한눈에 보이도록 다이어그램으로 바꿔 드려요.
          </p>
        </header>

        {/* 메인 레이아웃 */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* 왼쪽: 입력 카드 */}
          <section
            className="
              mt-1 rounded-3xl border border-neutral-200 bg-white
              shadow-[0_22px_45px_-24px_rgba(15,23,42,0.55)]
              backdrop-blur-sm
              dark:bg-[#020818] dark:border-white/15
              p-5 md:p-6 flex flex-col gap-4
            "
          >
            {/* 상단 강조 라인 */}
            <div className="flex flex-col gap-3">
              <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-[rgb(var(--hero-a))] dark:to-[rgb(var(--hero-b))]" />
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
                  영상 스크립트 붙여넣기
                </h2>
                <span className="text-[11px] md:text-xs text-neutral-500 dark:text-neutral-400">
                  길수록 분석에 조금 더 시간이 걸릴 수 있어요.
                </span>
              </div>
            </div>

            <textarea
              className="
                w-full min-h-[260px] md:min-h-[280px] resize-y
                rounded-2xl border border-neutral-200 bg-neutral-50
                px-3 py-2 text-sm md:text-[15px] text-neutral-900
                placeholder:text-neutral-400
                focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                dark:border-white/12 dark:bg-black/40 dark:text-neutral-50 dark:placeholder:text-neutral-500
              "
              placeholder="유튜브 · 강의 · 설교 등의 전체 스크립트를 이곳에 그대로 붙여넣어 주세요..."
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-300">
                이번 변환 작업에는 약{" "}
                <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                  {CREDITS_PER_RUN} credit
                </span>
                이 사용돼요.
              </p>

              <button
                type="button"
                onClick={handleClickGenerate}
                disabled={!scriptText.trim() || isProcessing}
                className="
                  inline-flex items-center gap-2 rounded-2xl px-5 py-2.5
                  text-sm md:text-[15px] font-semibold text-white
                  bg-blue-600 hover:bg-blue-700
                  dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                  shadow-sm hover:shadow-md
                  transition-transform hover:scale-[1.03] active:scale-100
                  disabled:bg-neutral-400 disabled:hover:scale-100 disabled:cursor-not-allowed
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--hero-a))]/60
                "
              >
                {isProcessing
                  ? "구조맵 생성 중..."
                  : "영상 스크립트로 구조맵 만들기"}
              </button>
            </div>
          </section>

          {/* 오른쪽: 가이드 + 진행 상태 */}
          <div className="flex flex-col gap-4">
            {/* 스크립트 가져오는 방법 (토글 도움말) */}
            <section
              className="
                rounded-3xl border border-neutral-200 bg-white
                shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]
                backdrop-blur-sm
                dark:bg-[#020818] dark:border-white/15
                p-4 md:p-5
              "
            >
              <button
                type="button"
                onClick={() => setIsHelpOpen((prev) => !prev)}
                className="
                  flex w-full items-center justify-between gap-2
                  text-left
                "
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white">
                    영상 스크립트 가져오는 방법
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:border-[rgb(var(--hero-b))]/40 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
                    도움말
                  </span>
                </div>
                <span
                  className={`
                    text-[11px]
                    transition-transform duration-200 ease-out
                    ${isHelpOpen ? "rotate-180" : ""}
                  `}
                >
                  ▾
                </span>
              </button>

              {/* 토글되는 본문 */}
              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-out
                  ${isHelpOpen ? "mt-3 max-h-[520px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"}
                `}
              >
                <div className="grid gap-3 text-xs md:text-sm text-neutral-700 dark:text-neutral-200">
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                      유튜브(YouTube) 기준
                    </h3>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>
                        영상 우측 아래 또는 더보기(···) 메뉴를 눌러 주세요.
                      </li>
                      <li>
                        &quot;자막&quot; 또는 &quot;대본 보기&quot; /
                        &quot;Transcript&quot; 메뉴를 선택해 주세요.
                      </li>
                      <li>
                        나오는 텍스트를 드래그해서 전체 복사해 주세요.
                      </li>
                      <li>
                        왼쪽 입력창에 그대로 붙여넣어 주시면 준비가 완료돼요.
                      </li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                      그 외 플랫폼 / 자막 파일
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        편집 툴이나 자막 파일(srt, vtt 등)에서 텍스트를 복사해
                        주세요.
                      </li>
                      <li>
                        AI 자막 생성 서비스에서 추출한 텍스트도 사용하셔도 돼요.
                      </li>
                      <li>
                        이미 정리된 스크립트 문서가 있다면 그대로 붙여넣어서
                        사용하셔도 괜찮아요.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 진행 중 표시 */}
            {isProcessing && (
              <section
                className="
                  rounded-3xl border border-blue-200 bg-blue-50
                  shadow-[0_18px_40px_-24px_rgba(37,99,235,0.45)]
                  backdrop-blur-sm
                  dark:bg-[#020818]/98 dark:border-[rgb(var(--hero-b))]/50
                  p-4 md:p-5 flex items-start gap-3
                "
              >
                <div className="mt-0.5 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-900 text-white text-xs font-semibold dark:bg-white dark:text-neutral-900">
                  AI
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm md:text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                    영상을 구조도로 정리하는 중이에요...
                  </p>
                  <div className="rounded-2xl bg-white/95 px-3 py-2.5 text-xs md:text-sm text-neutral-700 dark:bg-black/40 dark:text-neutral-200">
                    <p className="mb-1 flex items-center gap-1">
                      <span>{statusMessages[statusStep]}</span>
                      <span className="inline-flex gap-0.5">
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse delay-150">.</span>
                        <span className="animate-pulse delay-300">.</span>
                      </span>
                    </p>
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] md:text-xs text-neutral-500 dark:text-neutral-400">
                      <li>
                        요약이 아니라, 흐름 · 단계 · 분기를 먼저 분석하고
                        있어요.
                      </li>
                      <li>영상 길이에 따라 수십 초 이상 걸릴 수 있어요.</li>
                      <li>창을 닫지만 않으시면, 작업은 자동으로 이어져요.</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* 결과 영역 */}
        {result && (
          <section
            className="
              mt-6 rounded-3xl border border-neutral-200 bg-white
              shadow-[0_22px_45px_-24px_rgba(15,23,42,0.55)]
              backdrop-blur-sm
              dark:bg-[#020818]/98 dark:border-white/15
              p-4 md:p-6 space-y-3
            "
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
                생성된 구조맵 결과
              </h2>
              <span className="text-[11px] md:text-xs text-neutral-500 dark:text-neutral-400">
                이 영역에는 나중에 실제 다이어그램 컴포넌트를 연결하시면 돼요.
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-300">
              지금은 임시로 API 응답을 JSON 형태로 보여드리고 있어요. 추후 React
              Flow / Mindmap 뷰를 이 자리에 렌더링하시면 돼요.
            </p>
            <pre
              className="
                max-h-[360px] overflow-auto rounded-2xl
                bg-neutral-950/90 text-[11px] md:text-xs text-neutral-50
                p-3 border border-neutral-800
              "
            >
{JSON.stringify(result, null, 2)}
            </pre>
          </section>
        )}
      </div>

      {/* 크레딧 사용 안내 모달 */}
      {showCreditDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div
            className="
              w-full max-w-md rounded-3xl
              bg-white/98 border border-neutral-200
              shadow-[0_24px_70px_-30px_rgba(15,23,42,0.85)]
              p-5 md:p-6
              dark:bg-[#020617]/98 dark:border-white/12
            "
          >
            <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white mb-2.5">
              크레딧 사용 확인
            </h2>
            <p className="text-sm md:text-[15px] text-neutral-700 dark:text-neutral-200 mb-3">
              이 영상 스크립트를 구조도로 변환하는 데{" "}
              <span className="font-semibold">{CREDITS_PER_RUN} credit</span>이
              사용돼요.
            </p>
            <ul className="mb-4 list-disc list-inside text-xs md:text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
              <li>영상이 길수록 처리 시간이 길어질 수 있어요.</li>
              <li>
                한 번 실행하면 되돌릴 수 없고, 사용된 크레딧은 환불되지 않아요.
              </li>
              <li>처리 중에는 이 페이지를 닫지 않으시는 것을 추천드려요.</li>
            </ul>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreditDialog(false)}
                className="
                  rounded-2xl px-3 py-1.5 text-xs md:text-sm text-neutral-700
                  border border-neutral-300 bg-white
                  hover:bg-neutral-100
                  dark:text-neutral-100 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10
                "
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmUseCredits}
                className="
                  rounded-2xl px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white
                  bg-blue-600 hover:bg-blue-700
                  dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                  shadow-sm hover:shadow-md
                "
              >
                {CREDITS_PER_RUN} credit 사용하고 진행하기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
