"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type RewardNotice = {
  id: string;
  created_at: string; // ISO
  title: string;
  message: string;
  delta_credits: number;
  source?: "mission" | "billing" | "system";
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ✅ 가데이터 3건
const MOCK_NOTICES: RewardNotice[] = [
  {
    id: "rw_001",
    created_at: "2025-12-17T13:57:00+09:00",
    title: "보상 지급 완료",
    message: "미션 검토가 승인되어 크레딧이 지급되었습니다.",
    delta_credits: 5,
    source: "mission",
  },
  {
    id: "rw_002",
    created_at: "2025-12-17T13:57:00+09:00",
    title: "보상 지급 완료",
    message: "미션 검토가 승인되어 크레딧이 지급되었습니다.",
    delta_credits: 5,
    source: "mission",
  },
  {
    id: "rw_003",
    created_at: "2025-12-17T13:57:00+09:00",
    title: "보상 지급 완료",
    message: "미션 검토가 승인되어 크레딧이 지급되었습니다.",
    delta_credits: 5,
    source: "mission",
  },
];

export default function GlobalRewardNoticeStack() {
  const [items, setItems] = useState<RewardNotice[]>(MOCK_NOTICES);

  const count = items.length;

  const totalCredits = useMemo(
    () => items.reduce((acc, it) => acc + (it.delta_credits ?? 0), 0),
    [items]
  );

  const dismiss = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));
  const dismissAll = () => setItems([]);

  if (items.length === 0) return null;

  return (
    <div
      className="
        pointer-events-none
        fixed right-4 top-20 z-[80]
        w-[360px] max-w-[calc(100vw-2rem)]
      "
      aria-live="polite"
      aria-label="보상 알림"
    >
      {/* 헤더(작게) */}
      <div className="pointer-events-auto mb-2 flex items-center justify-between">
        <div
          className="
            inline-flex items-center gap-2
            rounded-full border border-neutral-200/70 dark:border-white/12
            bg-white/65 dark:bg-black/25 backdrop-blur
            px-3 py-1
            text-[11px] font-semibold text-neutral-700 dark:text-neutral-200
          "
        >
          <span
            className="
              inline-flex h-2 w-2 rounded-full
              bg-emerald-500
              shadow-[0_0_0_3px_rgba(16,185,129,0.18)]
            "
            aria-hidden
          />
          알림 {count}건
          <span className="text-neutral-400 dark:text-neutral-400" aria-hidden>
            ·
          </span>
          <span className="text-emerald-700 dark:text-emerald-300">
            +{totalCredits} 크레딧
          </span>
        </div>

        <button
          type="button"
          onClick={dismissAll}
          className="
            pointer-events-auto
            rounded-full px-2 py-1
            text-[11px] font-semibold
            text-neutral-500 hover:text-neutral-800
            dark:text-neutral-400 dark:hover:text-neutral-200
            hover:bg-white/60 dark:hover:bg-white/5
            transition
          "
        >
          모두 닫기
        </button>
      </div>

      {/* 카드 스택 */}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 520, damping: 42 }}
              className={cn(
                "pointer-events-auto",
                "relative overflow-hidden rounded-2xl",
                "border border-neutral-200/80 dark:border-white/12",
                "bg-white/80 dark:bg-black/35 backdrop-blur",
                "shadow-[0_18px_45px_-26px_rgba(15,23,42,0.28)]"
              )}
            >
              {/* 은은한 포인트 */}
              <div
                aria-hidden
                className="
                  pointer-events-none absolute inset-0
                  bg-[radial-gradient(240px_120px_at_18%_10%,rgba(16,185,129,0.16),transparent_60%),radial-gradient(240px_120px_at_92%_45%,rgba(59,130,246,0.12),transparent_60%)]
                  dark:bg-[radial-gradient(240px_120px_at_18%_10%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(240px_120px_at_92%_45%,rgba(99,102,241,0.16),transparent_60%)]
                "
              />

              <div className="relative p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {/* 상태 배지(승인 강조) */}
                      <span
                        className="
                          inline-flex items-center rounded-full
                          border border-emerald-200/70 bg-emerald-50/80
                          px-2 py-1
                          text-[11px] font-semibold text-emerald-800
                          dark:border-emerald-300/20 dark:bg-emerald-400/5 dark:text-emerald-200
                        "
                      >
                        승인
                      </span>

                      <div className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                        {it.title}
                      </div>
                    </div>

                    <div className="mt-1 text-[12px] text-neutral-700 dark:text-neutral-300">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                        +{it.delta_credits} 크레딧
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {" "}
                        · {it.message}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                      {formatDateTime(it.created_at)}
                      {it.source ? (
                        <span className="ml-2 text-neutral-400 dark:text-neutral-500">
                          · {it.source === "mission" ? "미션" : it.source}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => dismiss(it.id)}
                    className="
                      -mr-1 -mt-1
                      inline-flex h-8 w-8 items-center justify-center
                      rounded-full
                      text-neutral-500 hover:text-neutral-900
                      hover:bg-white/70
                      dark:text-neutral-400 dark:hover:text-neutral-50
                      dark:hover:bg-white/5
                      transition
                    "
                    aria-label="알림 닫기"
                    title="닫기"
                  >
                    <span className="text-[18px] leading-none">×</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}


function CreatedAtText({ createdAt }: { createdAt: string }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
  
    return (
      <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
        {mounted ? formatDateTime(createdAt) : ""} 
      </div>
    );
  }