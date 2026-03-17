"use client";

import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const GUIDE_STEPS = [
  {
    number: 1,
    title: "영상 밑의 '더보기' 열기",
    imageLabel: "1단계 이미지",
    accent: "neutral",
    imageSrc: "/images/help/youtube-step1-watch-page.png",
  },
  {
    number: 2,
    title: "스크립트열기 클릭!",
    imageLabel: "2단계 이미지",
    accent: "neutral",
    imageSrc: "/images/help/youtube-step2-menu.png",
  },
  {
    number: 3,
    title: "처음부분 드래그 선택",
    imageLabel: "3단계 이미지",
    accent: "neutral",
    imageSrc: "/images/help/firstwordselected.png",
  },
  {
    number: 4,
    title: "아래로 끝까지 스크롤",
    imageLabel: "4단계 이미지",
    accent: "neutral",
    imageSrc: "/images/help/scroll.png",
  },
  {
    number: 5,
    title: "Shift 누른 채 유지",
    description: "떼지 말고 바로 마지막 단어를 클릭하세요.",
    imageLabel: "5단계 이미지",
    accent: "indigo",
    imageSrc: "/images/help/shiftkey.jpg",
  },
  {
    number: 6,
    title: "마지막 단어 클릭",
    imageLabel: "6단계 이미지",
    accent: "neutral",
    imageSrc: "/images/help/allselected.png",
  },
  {
    number: 7,
    title: "Ctrl + C",
    imageLabel: "7단계 이미지",
    accent: "neutral",
    keycap: true,
    imageSrc: "/images/help/copy.png",
  },
  {
    number: 8,
    title: "입력창에 Ctrl + V",
    imageLabel: "8단계 이미지",
    accent: "neutral",
    keycap: true,
    imageSrc: "/images/help/paste.png",
  },
] as const;

export default function YoutubeScriptDialog({ open, onClose }: Props) {
  const [openStep, setOpenStep] = useState<number>(5);

  // ✅ ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setOpenStep(5);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/55 backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
      aria-label="유튜브 링크로 스크립트 가져오기"
      onMouseDown={(e) => {
        // ✅ 바깥 클릭 닫기
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="
          w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl
          bg-white/98 border border-neutral-200
          shadow-[0_24px_70px_-30px_rgba(15,23,42,0.85)]
          p-5 md:p-6

          dark:bg-[#0F172A]
          dark:border-white/10
          dark:ring-1 dark:ring-white/5
          dark:shadow-[0_28px_90px_-55px_rgba(0,0,0,0.85)]
          dark:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.0))]
        "
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Icon icon="mdi:youtube" className="h-5 w-5 text-red-500" />
              유투브 스크립트 가져오는 방법
            </h2>
            <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-300">
              유튜브 스크립트 전체를 한 번에 복사해오세요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl p-2
              text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100
              dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/10
            "
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {GUIDE_STEPS.map((step) => {
            const expanded = openStep === step.number;
            const isAccent = step.accent === "indigo";

            return (
              <div
                key={step.number}
                className={[
                  "overflow-hidden rounded-2xl border transition-colors",
                  isAccent
                    ? "border-indigo-200 bg-indigo-50 dark:border-indigo-400/30 dark:bg-indigo-500/10"
                    : "border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04]",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => setOpenStep(expanded ? 0 : step.number)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                >
                  <div
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      isAccent
                        ? "bg-indigo-600 text-white"
                        : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
                    ].join(" ")}
                  >
                    {step.number}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        "text-sm font-medium",
                        isAccent
                          ? "text-indigo-950 dark:text-indigo-100"
                          : "text-neutral-800 dark:text-neutral-100",
                      ].join(" ")}
                    >
                      {step.keycap ? (
                        step.number === 7 ? (
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-neutral-800 shadow-sm dark:bg-slate-900 dark:text-neutral-100">
                            {step.title}
                          </span>
                        ) : (
                          <>
                            입력창에{" "}
                            <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-neutral-800 shadow-sm dark:bg-slate-900 dark:text-neutral-100">
                              Ctrl + V
                            </span>
                          </>
                        )
                      ) : step.number === 5 ? (
                        <>
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-indigo-700 shadow-sm dark:bg-indigo-950 dark:text-indigo-200">
                            Shift
                          </span>{" "}
                          누른 채 유지
                        </>
                      ) : (
                        step.title
                      )}
                    </p>

                    {step.description ? (
                      <p
                        className={[
                          "mt-1 text-xs",
                          isAccent
                            ? "text-indigo-700 dark:text-indigo-200"
                            : "text-neutral-500 dark:text-neutral-400",
                        ].join(" ")}
                      >
                        {step.description}
                      </p>
                    ) : null}
                  </div>

                  <Icon
                    icon="mdi:chevron-down"
                    className={[
                      "h-5 w-5 shrink-0 transition-transform",
                      expanded ? "rotate-180" : "",
                      isAccent
                        ? "text-indigo-500 dark:text-indigo-200"
                        : "text-neutral-400 dark:text-neutral-500",
                    ].join(" ")}
                  />
                </button>

                {expanded ? (
                  <div className="px-3 pb-3">
                    <div
                      className={[
                        "flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed",
                        isAccent
                          ? "border-indigo-300 bg-white/70 dark:border-indigo-400/30 dark:bg-black/10"
                          : "border-neutral-300 bg-white/90 dark:border-white/12 dark:bg-black/10",
                      ].join(" ")}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        {"imageSrc" in step ? (
                          <img
                            src={step.imageSrc}
                            alt={step.title}
                            className="max-h-[320px] w-full rounded-xl object-contain"
                          />
                        ) : (
                          <>
                            <Icon
                              icon="mdi:image-outline"
                              className={[
                                "h-8 w-8",
                                isAccent
                                  ? "text-indigo-400 dark:text-indigo-300"
                                  : "text-neutral-300 dark:text-neutral-500",
                              ].join(" ")}
                            />
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                              {step.imageLabel}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              여기에 관련 이미지를 넣으면 됩니다.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-2xl px-3.5 py-2 text-xs md:text-sm text-neutral-700
              border border-neutral-300 bg-white
              hover:bg-neutral-100

              dark:text-neutral-100
              dark:border-white/15
              dark:bg-white/6
              dark:hover:bg-white/10
            "
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
