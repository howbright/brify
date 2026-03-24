"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type FeedbackMissionStats = {
  earned_total?: number;
  pending?: number; // 검토중
  accepted?: number; // 채택됨(보상 1 지급)
  shipped?: number; // 반영됨(추가 2 지급)
  rejected?: number; // 반려
  submitted_week?: number; // 이번 주 제출 수
};

type SubmitResponse = {
  ok: boolean;
  message?: string;
};

const CATEGORIES = [
  { key: "bug", label: "버그 제보" },
  { key: "ux", label: "사용성 개선" },
  { key: "feature", label: "기능 제안" },
  { key: "performance", label: "성능/속도" },
  { key: "pricing", label: "요금/크레딧" },
  { key: "etc", label: "기타" },
] as const;

const POLICY = {
    creditsOnAccept: 1,
    creditsOnShipBonus: 2,
    creditsTotal: 3,
    submissions: { perWeek: 2 },
    capture: { maxCount: 3, maxSizeMB: 10 },
    review: { etaHoursText: "24~72시간" },
  
    // ✅ 추가
    duplicateReward: {
      maxRewardedPerIssue: 3, // 선착순 N명까지만
      shipBonusFirstOnly: true, // 반영 보너스는 최초 1건만
    },
  } as const;

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

// 내부 계산용(표시에는 KST 문구 안 씀)
const KST_OFFSET_MIN = 9 * 60;
function getNowKstShifted() {
  return new Date(Date.now() + KST_OFFSET_MIN * 60 * 1000);
}
function getStartOfWeekKstShifted(dKstShifted: Date) {
  const d = new Date(dKstShifted);
  const day = d.getUTCDay(); // 0=일,1=월...
  const daysSinceMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
function getNextResetKstShifted(nowKstShifted: Date) {
  const start = getStartOfWeekKstShifted(nowKstShifted);
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 7);
  return next;
}
function formatRemain(ms: number) {
  if (ms <= 0) return "곧 리셋";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}일 ${hours}시간 ${mins}분`;
  if (hours > 0) return `${hours}시간 ${mins}분`;
  return `${mins}분`;
}

function StatPill({
  label,
  value,
  strong,
  loading,
}: {
  label: string;
  value: string;
  strong?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-400 dark:border-white/20",
        "bg-white dark:bg-black/45",
        "px-3 py-2"
      )}
    >
      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-sm font-semibold",
          strong
            ? "text-neutral-900 dark:text-neutral-50"
            : "text-neutral-800 dark:text-neutral-200"
        )}
      >
        {loading ? (
          <span className="inline-block h-4 w-14 rounded bg-neutral-200/70 dark:bg-white/10 align-middle" />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function WeeklyQuotaBadge({
  used,
  limit,
  loading,
  remainText,
}: {
  used: number;
  limit: number;
  loading: boolean;
  remainText: string;
}) {
  const safeLimit = Math.max(1, limit);
  const remaining = Math.max(0, safeLimit - used);
  const usedPct = Math.min(
    100,
    Math.max(0, Math.round((used / safeLimit) * 100))
  );
  const remainingPct = 100 - usedPct;

  return (
    <div
      className="
        w-full
        rounded-3xl border border-slate-400 dark:border-white/20
        bg-white dark:bg-black/45
        px-4 py-3 sm:px-5 sm:py-4
      "
      aria-label="주간 제출 한도"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
            이번 주 남은 제출
          </div>

          <div className="flex items-end gap-2">
            {loading ? (
              <span className="inline-block h-8 w-28 rounded-xl bg-neutral-200/70 dark:bg-white/10" />
            ) : (
              <>
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
                  {remaining}
                </span>
                <span className="pb-1 text-sm font-semibold text-neutral-500 dark:text-neutral-300">
                  / {safeLimit}건
                </span>
              </>
            )}
          </div>

          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {loading ? (
              <span className="inline-block h-4 w-44 rounded bg-neutral-200/70 dark:bg-white/10 align-middle" />
            ) : (
              <>
                이번 주 {used}건 사용 · {remaining}건 남음
              </>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
            다음 리셋까지
          </div>
          <div className="mt-1 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
            {loading ? (
              <span className="inline-block h-4 w-28 rounded bg-neutral-200/70 dark:bg-white/10" />
            ) : (
              remainText
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200/70 dark:bg-white/10">
          <div
            className="
              h-full rounded-full
              bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
              transition-[width] duration-500
            "
            style={{ width: `${remainingPct}%` }}
            role="progressbar"
            aria-valuenow={remaining}
            aria-valuemin={0}
            aria-valuemax={safeLimit}
          />
        </div>

        <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
          <span>남은 {remaining}건</span>
          <span>사용 {used}건</span>
        </div>
      </div>
    </div>
  );
}

function MiniNotice({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "info" | "warn";
}) {
  const toneCls =
    tone === "warn"
      ? "border-amber-200/80 dark:border-amber-300/20 bg-amber-50/70 dark:bg-amber-400/5"
      : tone === "info"
      ? "border-blue-200/70 dark:border-blue-300/20 bg-blue-50/60 dark:bg-blue-400/5"
      : "border-slate-400 dark:border-white/20 bg-white dark:bg-black/40";

  return (
    <div className={cn("rounded-2xl border p-3", toneCls)}>
      {!!title && (
        <div className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200">
          {title}
        </div>
      )}
      <div className={cn("text-[12px] text-neutral-700 dark:text-neutral-300 leading-relaxed", title ? "mt-1.5" : "")}>
        {children}
      </div>
    </div>
  );
}

export default function FeedbackMissionPanel() {
  // stats
  const [stats, setStats] = useState<FeedbackMissionStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const refreshStats = async () => {
    try {
      setLoadingStats(true);
      // ✅ 너 서버에 맞춰 엔드포인트만 바꿔도 됨
      const res = await fetch("/api/missions/feedback/stats", {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as FeedbackMissionStats;
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const submittedWeek = stats?.submitted_week ?? 0;
  const submitCapReached = submittedWeek >= POLICY.submissions.perWeek;

  // reset countdown label only
  const [remainText, setRemainText] = useState(() => {
    const now = getNowKstShifted();
    const next = getNextResetKstShifted(now);
    return formatRemain(next.getTime() - now.getTime());
  });

  useEffect(() => {
    const tick = () => {
      const now = getNowKstShifted();
      const next = getNextResetKstShifted(now);
      setRemainText(formatRemain(next.getTime() - now.getTime()));
    };
    tick();
    const id = window.setInterval(tick, 1000 * 30);
    return () => window.clearInterval(id);
  }, []);

  // form
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]["key"]>("bug");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const previews = useMemo(() => {
    return files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const onPickFiles = () => fileInputRef.current?.click();

  const onFilesSelected = (incoming: FileList | null) => {
    if (!incoming) return;

    const next: File[] = [];
    for (const f of Array.from(incoming)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > POLICY.capture.maxSizeMB * 1024 * 1024) continue;
      next.push(f);
    }

    if (next.length === 0) {
      toast.error(
        `이미지 파일만 업로드할 수 있습니다. (1장당 최대 ${POLICY.capture.maxSizeMB}MB)`
      );
      return;
    }

    const merged = [...files, ...next].slice(0, POLICY.capture.maxCount);
    setFiles(merged);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const canSubmit =
    !submitting &&
    !submitCapReached &&
    title.trim().length >= 4 &&
    detail.trim().length >= 10;

  const submit = async () => {
    if (!canSubmit) return;

    if (referenceUrl.trim() && !/^https?:\/\//i.test(referenceUrl.trim())) {
      toast.error("참고 링크는 http(s)로 시작하는 URL 형식으로 입력해 주세요.");
      return;
    }

    if (submitCapReached) {
      toast.error(
        `이번 주 제출 제한(${POLICY.submissions.perWeek}건)에 도달했습니다. 다음 리셋 이후에 다시 제출해 주세요.`
      );
      return;
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("category", category);
      fd.append("title", title.trim());
      fd.append("detail", detail.trim());
      fd.append("steps", steps.trim());
      fd.append("expected", expected.trim());
      fd.append("referenceUrl", referenceUrl.trim());
      files.forEach((f) => fd.append("captures", f));

      // 클라 정책(서버에서 검증/로그용)
      fd.append("clientPolicy_weeklyLimit", String(POLICY.submissions.perWeek));
      fd.append("clientPolicy_creditsOnAccept", String(POLICY.creditsOnAccept));
      fd.append(
        "clientPolicy_creditsOnShipBonus",
        String(POLICY.creditsOnShipBonus)
      );

      // ✅ 너 서버에 맞춰 엔드포인트만 바꿔도 됨
      const res = await fetch("/api/missions/feedback/submit", {
        method: "POST",
        body: fd,
      });

      let data: SubmitResponse | null = null;
      try {
        data = (await res.json()) as SubmitResponse;
      } catch {
        // ignore
      }

      if (!res.ok || data?.ok === false) {
        toast.error(
          data?.message ?? "제출에 실패했습니다. 잠시 후 다시 시도해 주세요."
        );
        return;
      }

      toast.success(
        "피드백 제출 완료! 채택되면 보상이 지급되고, 실제 반영 시 추가 보상이 지급됩니다."
      );

      setTitle("");
      setDetail("");
      setSteps("");
      setExpected("");
      setReferenceUrl("");
      setFiles([]);

      await refreshStats();
    } catch {
      toast.error("제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
            피드백 미션 참여로 크레딧 받기
          </h2>
          <p className="mt-2 text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-2xl">
            유용한 피드백이{" "}
            <span className="font-semibold text-blue-700 dark:text-[rgb(var(--hero-b))]">
              채택되면 {POLICY.creditsOnAccept} 크레딧
            </span>
            , 실제 업데이트에{" "}
            <span className="font-semibold text-blue-700 dark:text-[rgb(var(--hero-b))]">
              반영되면 +{POLICY.creditsOnShipBonus} 크레딧
            </span>{" "}
            (총{" "}
            <span className="font-semibold text-blue-700 dark:text-[rgb(var(--hero-b))]">
              {POLICY.creditsTotal} 크레딧
            </span>
            )을 지급합니다.
          </p>
        </div>

        <div className="mt-2 md:mt-0 flex items-center gap-2">
          <Link
            href="/billing"
            className="
              inline-flex items-center justify-center rounded-2xl
              border border-neutral-200/80 bg-white/90 px-4 py-2.5
              text-sm font-medium text-neutral-900
              hover:-translate-y-0.5 hover:shadow-md
              transition-all
              dark:border-white/20 dark:bg-black/60 dark:text-neutral-50
            "
          >
            크레딧 구매
          </Link>

          <Link
            href="/video-to-map"
            className="
              inline-flex items-center justify-center rounded-2xl
              px-4 py-2.5 text-sm font-semibold
              bg-blue-600 text-white
              hover:bg-blue-700
              hover:-translate-y-0.5 hover:shadow-lg
              active:translate-y-0
              transition-all
              dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
            "
          >
            새 구조맵
          </Link>
        </div>
      </div>

      {/* Summary */}
      <section className="mt-6">
        <div
          className="
            rounded-3xl border border-neutral-200/80 dark:border-white/15
            bg-white/90 dark:bg-black/45
            px-5 py-5 sm:px-6 sm:py-6
            shadow-[0_18px_45px_-26px_rgba(15,23,42,0.20)]
          "
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6">
            {/* Left */}
            <div className="flex flex-col gap-3 sm:flex-1 sm:min-w-0">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                <span
                  className="
                    inline-flex h-2.5 w-2.5 rounded-full
                    bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500
                    shadow-[0_0_0_3px_rgba(99,102,241,0.12)]
                  "
                  aria-hidden
                />
                <span>내 피드백 현황</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <StatPill
                  label="검토중"
                  value={String(stats?.pending ?? 0)}
                  loading={loadingStats}
                />
                <StatPill
                  label="채택"
                  value={String(stats?.accepted ?? 0)}
                  loading={loadingStats}
                />
                <StatPill
                  label="반영"
                  value={String(stats?.shipped ?? 0)}
                  loading={loadingStats}
                />
                <StatPill
                  label="반려"
                  value={String(stats?.rejected ?? 0)}
                  loading={loadingStats}
                />
                <StatPill
                  label="총 적립"
                  value={String(stats?.earned_total ?? 0)}
                  strong
                  loading={loadingStats}
                />
              </div>

              <WeeklyQuotaBadge
                used={submittedWeek}
                limit={POLICY.submissions.perWeek}
                loading={loadingStats}
                remainText={remainText}
              />

              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                제출 후 보통{" "}
                <span className="font-semibold">{POLICY.review.etaHoursText}</span>{" "}
                내에 1차 검토됩니다. (개발 반영 일정은 별도)
              </p>
            </div>

            {/* Right reward box */}
            <div className="flex flex-col gap-2 sm:w-[280px] md:w-[300px]">
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                미션 보상
              </div>

              <div
                className="
                  relative overflow-hidden rounded-2xl
                  border border-neutral-200/80 dark:border-white/15
                  bg-white/70 dark:bg-black/30
                  p-4
                "
              >
                <div
                  aria-hidden
                  className="
                    pointer-events-none absolute inset-0
                    bg-[radial-gradient(180px_90px_at_18%_10%,rgba(59,130,246,0.16),transparent_60%),radial-gradient(220px_120px_at_92%_45%,rgba(99,102,241,0.14),transparent_60%)]
                    dark:bg-[radial-gradient(180px_90px_at_18%_10%,rgba(129,140,248,0.18),transparent_60%),radial-gradient(220px_120px_at_92%_45%,rgba(99,102,241,0.18),transparent_60%)]
                  "
                />

                <div className="relative flex flex-col gap-2">
                  <span
                    className="
                      inline-flex w-fit items-center rounded-full
                      border border-blue-200/70 bg-blue-50/80
                      px-2 py-1
                      text-[11px] font-semibold text-blue-700
                      dark:border-white/15 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]
                    "
                  >
                    채택/반영 보상
                  </span>

                  <div className="flex flex-col gap-1 text-[12px] text-neutral-700 dark:text-neutral-300">
                    <div className="flex items-center justify-between">
                      <span>채택 시</span>
                      <span className="font-extrabold text-neutral-900 dark:text-neutral-50">
                        +{POLICY.creditsOnAccept} 크레딧
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>반영 시</span>
                      <span className="font-extrabold text-neutral-900 dark:text-neutral-50">
                        +{POLICY.creditsOnShipBonus} 크레딧
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-end gap-2">
                    <span
                      className="
                        text-4xl font-extrabold tracking-tight
                        text-transparent bg-clip-text
                        bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700
                        dark:from-[rgb(var(--hero-a))] dark:via-[rgb(var(--hero-b))] dark:to-purple-300
                      "
                    >
                      {POLICY.creditsTotal}
                    </span>
                    <span className="pb-1 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                      총 보상
                    </span>
                  </div>

                  <div className="text-[12px] text-neutral-600 dark:text-neutral-300">
                    채택/반영 완료 시 자동 지급됩니다.
                  </div>
                </div>
              </div>

              <MiniNotice title="중복/병합 안내" tone="info">
              동일/유사 피드백은 내부적으로 병합될 수 있으며,{" "}
  <b>선착순 {POLICY.duplicateReward.maxRewardedPerIssue}건</b>까지만 채택 보상이
  지급될 수 있어요.
  {POLICY.duplicateReward.shipBonusFirstOnly && (
    <>
      {" "}
      반영 보너스(+{POLICY.creditsOnShipBonus})는{" "}
      <b>최초 1건</b>에만 지급될 수 있어요.
    </>
  )}
              </MiniNotice>
            </div>
          </div>

          {submitCapReached && (
            <div className="mt-4">
              <MiniNotice title="이번 주 제출 제한에 도달했습니다" tone="warn">
                이번 주 제출 상한({POLICY.submissions.perWeek}건)에 도달했습니다.
                다음 리셋 이후에 다시 제출해 주세요.
              </MiniNotice>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {/* Left: Guide */}
        <div
          className="
            rounded-3xl border border-neutral-200/80 dark:border-white/15
            bg-white/85 dark:bg-black/40
            p-5 sm:p-6
          "
        >
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            피드백 제출 가이드
          </h2>
          <p className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-300">
            좋은 피드백일수록 채택 확률이 올라갑니다. (캡처는 선택)
          </p>

          <div className="mt-5 flex flex-col gap-2">
            {[
              "문제 상황(무엇이 불편했는지)을 구체적으로 적어 주세요.",
              "가능하면 재현 방법(steps)을 적어 주세요.",
              "기대하는 결과(원하는 동작)를 적어 주세요.",
              "캡처/스크린샷을 붙이면 검토가 빨라집니다. (선택)",
            ].map((s, i) => (
              <div
                key={s}
                className="
                  flex items-start gap-3
                  rounded-2xl px-3 py-2
                  border border-black/5 dark:border-white/12
                  bg-white/70 dark:bg-white/5
                "
              >
                <div
                  className="
                    mt-0.5 flex h-6 w-6 items-center justify-center
                    rounded-full border border-black/10 dark:border-white/15
                    text-[11px] font-semibold text-neutral-700 dark:text-neutral-200
                    bg-neutral-50/80 dark:bg-black/30
                  "
                >
                  {i + 1}
                </div>
                <div className="text-[13px] sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 leading-snug">
                  {s}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <MiniNotice title="제출 정책" tone="info">
              • 주간 제출 제한: <b>주 {POLICY.submissions.perWeek}건</b>
              <br />• 채택 시 즉시 지급 / 반영 시 추가 지급
              <br />• 반영 여부/시점은 개발 일정에 따라 달라질 수 있음
            </MiniNotice>

            <MiniNotice title="반려되는 대표 사례">
              <ul className="flex flex-col gap-1.5 list-disc pl-5">
                <li>너무 추상적이어서 문제 파악이 어려운 경우</li>
                <li>이미 반영된 내용이거나 의미 있는 차이가 없는 중복 제안</li>
                <li>스팸/비방/정책 위반</li>
                <li>이미 접수된 이슈와 동일/유사한 피드백(중복 제출)</li>
              </ul>
            </MiniNotice>
          </div>
        </div>

        {/* Right: Submit */}
        <div
          className="
            relative overflow-hidden self-start
            rounded-3xl
            border border-blue-200/70 dark:border-white/15
            bg-white/90 dark:bg-black/45
            p-5 sm:p-6
            shadow-[0_18px_45px_-26px_rgba(59,130,246,0.25)]
            md:sticky md:top-24
          "
        >
          <div
            aria-hidden
            className="
              pointer-events-none absolute inset-0
              bg-[radial-gradient(260px_140px_at_18%_12%,rgba(59,130,246,0.14),transparent_60%),radial-gradient(360px_200px_at_92%_48%,rgba(99,102,241,0.12),transparent_60%)]
              dark:bg-[radial-gradient(260px_140px_at_18%_12%,rgba(129,140,248,0.18),transparent_60%),radial-gradient(360px_200px_at_92%_48%,rgba(99,102,241,0.16),transparent_60%)]
            "
          />

          <div className="relative flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="
                    inline-flex items-center rounded-full
                    border border-blue-200/70 bg-blue-50/80
                    px-2.5 py-1
                    text-[11px] font-semibold text-blue-700
                    dark:border-white/15 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]
                  "
                >
                  지금 제출
                </span>

                <div className="text-[11px] text-neutral-700 dark:text-neutral-200">
                  총{" "}
                  <span
                    className="
                      font-extrabold
                      text-transparent bg-clip-text
                      bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700
                      dark:from-[rgb(var(--hero-a))] dark:via-[rgb(var(--hero-b))] dark:to-purple-300
                    "
                  >
                    {POLICY.creditsTotal} 크레딧
                  </span>{" "}
                  가능
                </div>
              </div>

              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                피드백 제출
              </h2>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                제목/상세는 필수야. 캡처는 있으면 좋아.
              </p>
            </div>

            {submitCapReached && (
              <MiniNotice title="이번 주 제출 제한에 도달했습니다" tone="warn">
                이번 주 제출 상한({POLICY.submissions.perWeek}건)에 도달했습니다.
                다음 리셋 이후에 다시 제출해 주세요.
              </MiniNotice>
            )}

            {/* Form */}
            <div className="grid gap-3">
              {/* category */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                  유형 <span className="text-neutral-400">(필수)</span>
                </label>
                <select
                  value={category}
                  disabled={submitCapReached}
                  onChange={(e) =>
                    setCategory(
                      e.target.value as (typeof CATEGORIES)[number]["key"]
                    )
                  }
                  className={cn(
                    "mt-1 w-full rounded-2xl px-3 py-2 text-sm outline-none",
                    "border border-neutral-200/80 dark:border-white/15",
                    "bg-white/90 dark:bg-black/40",
                    "text-neutral-900 dark:text-neutral-50",
                    "focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-[rgb(var(--hero-b))]/35",
                    submitCapReached && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* title */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                  제목 <span className="text-neutral-400">(필수)</span>
                </label>
                <input
                  value={title}
                  disabled={submitCapReached}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: YouTube 링크 입력 후 요약이 멈춰요"
                  className={cn(
                    "mt-1 w-full rounded-2xl px-3 py-2 text-sm outline-none",
                    "border border-neutral-200/80 dark:border-white/15",
                    "bg-white/90 dark:bg-black/40",
                    "text-neutral-900 dark:text-neutral-50",
                    "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                    "focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-[rgb(var(--hero-b))]/35",
                    submitCapReached && "opacity-60 cursor-not-allowed"
                  )}
                />
                <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                  최소 4자 권장
                </div>
              </div>

              {/* detail */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                  상세 설명 <span className="text-neutral-400">(필수)</span>
                </label>
                <textarea
                  value={detail}
                  disabled={submitCapReached}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="무엇이 문제인지 / 왜 불편한지 / 어떤 상황에서 발생하는지"
                  rows={5}
                  className={cn(
                    "mt-1 w-full rounded-2xl px-3 py-2 text-sm outline-none",
                    "border border-neutral-200/80 dark:border-white/15",
                    "bg-white/90 dark:bg-black/40",
                    "text-neutral-900 dark:text-neutral-50",
                    "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                    "focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-[rgb(var(--hero-b))]/35",
                    submitCapReached && "opacity-60 cursor-not-allowed"
                  )}
                />
                <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                  최소 10자 권장
                </div>
              </div>

              {/* steps */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                  재현 방법 <span className="text-neutral-400">(선택)</span>
                </label>
                <textarea
                  value={steps}
                  disabled={submitCapReached}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder={`예:\n1) video-to-map에서 URL 입력\n2) Summarize 클릭\n3) 30초 후 멈춤`}
                  rows={3}
                  className={cn(
                    "mt-1 w-full rounded-2xl px-3 py-2 text-sm outline-none",
                    "border border-neutral-200/80 dark:border-white/15",
                    "bg-white/90 dark:bg-black/40",
                    "text-neutral-900 dark:text-neutral-50",
                    "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                    "focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-[rgb(var(--hero-b))]/35",
                    submitCapReached && "opacity-60 cursor-not-allowed"
                  )}
                />
              </div>

              {/* expected */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                  기대 결과 <span className="text-neutral-400">(선택)</span>
                </label>
                <textarea
                  value={expected}
                  disabled={submitCapReached}
                  onChange={(e) => setExpected(e.target.value)}
                  placeholder="예: 진행률 표시 + 타임아웃 안내 / 실패 시 재시도 버튼"
                  rows={3}
                  className={cn(
                    "mt-1 w-full rounded-2xl px-3 py-2 text-sm outline-none",
                    "border border-neutral-200/80 dark:border-white/15",
                    "bg-white/90 dark:bg-black/40",
                    "text-neutral-900 dark:text-neutral-50",
                    "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                    "focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-[rgb(var(--hero-b))]/35",
                    submitCapReached && "opacity-60 cursor-not-allowed"
                  )}
                />
              </div>

              {/* reference url */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                  참고 링크 <span className="text-neutral-400">(선택)</span>
                </label>
                <input
                  value={referenceUrl}
                  disabled={submitCapReached}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://... (관련 페이지/영상/스크린레코딩 링크 등)"
                  className={cn(
                    "mt-1 w-full rounded-2xl px-3 py-2 text-sm outline-none",
                    "border border-neutral-200/80 dark:border-white/15",
                    "bg-white/90 dark:bg-black/40",
                    "text-neutral-900 dark:text-neutral-50",
                    "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                    "focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-[rgb(var(--hero-b))]/35",
                    submitCapReached && "opacity-60 cursor-not-allowed"
                  )}
                />
              </div>

              {/* captures optional */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                  캡처 이미지 <span className="text-neutral-400">(선택)</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onFilesSelected(e.target.files)}
                />

                <button
                  type="button"
                  onClick={onPickFiles}
                  disabled={submitCapReached}
                  className={cn(
                    "mt-1 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                    submitCapReached
                      ? "bg-neutral-200 text-neutral-500 dark:bg-white/10 dark:text-neutral-500 cursor-not-allowed"
                      : cn(
                          "border border-blue-200/70 dark:border-white/15",
                          "bg-white/90 dark:bg-black/35",
                          "text-neutral-900 dark:text-neutral-50",
                          "hover:-translate-y-0.5 hover:shadow-md"
                        )
                  )}
                >
                  이미지 선택 (최대 {POLICY.capture.maxCount}장)
                </button>

                <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                  이미지 형식만 가능, 1장당 최대 {POLICY.capture.maxSizeMB}MB
                </div>

                {previews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {previews.map((p) => (
                      <div
                        key={p.file.name}
                        className="
                          relative overflow-hidden rounded-2xl
                          border border-black/5 dark:border-white/12
                          bg-white/70 dark:bg-black/30
                        "
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.url}
                          alt={p.file.name}
                          className="h-24 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(p.file.name)}
                          className="
                            absolute right-1 top-1
                            rounded-full bg-black/55 text-white
                            px-2 py-1 text-[10px]
                            hover:bg-black/70
                          "
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* submit */}
              <motion.button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "mt-1 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                  canSubmit
                    ? cn(
                        "bg-blue-600 text-white hover:bg-blue-700",
                        "hover:-translate-y-0.5 hover:shadow-lg",
                        "dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]"
                      )
                    : "bg-neutral-200 text-neutral-500 dark:bg-white/10 dark:text-neutral-500 cursor-not-allowed"
                )}
              >
                {submitting ? "제출 중..." : "피드백 제출하기"}
              </motion.button>

              <MiniNotice title="채택 확률 올리는 팁" tone="neutral">
                <ul className="flex flex-col gap-1.5 list-disc pl-5">
                  <li>“문제 → 재현 → 기대결과” 3종 세트로 쓰면 거의 무조건 도움 됨</li>
                  <li>가능하면 캡처/스크린레코딩 링크 첨부</li>
                  <li>한 번에 한 주제만(너무 많은 요구를 섞지 않기)</li>
                </ul>
              </MiniNotice>
            </div>
          </div>
        </div>
      </section>

      {/* Footer hint */}
      <section className="mt-8">
        <div
          className="
            rounded-3xl border border-neutral-200/80 dark:border-white/15
            bg-white/80 dark:bg-black/35
            p-4 sm:p-5
            text-xs sm:text-sm text-neutral-700 dark:text-neutral-200
          "
        >
          <div className="font-semibold">TIP</div>
          <div className="mt-1.5">
            재현 가능한 버그 제보는 검토/반영이 빨라서 보상까지 이어질 확률이 높아.
          </div>
        </div>
      </section>
    </div>
  );
}
