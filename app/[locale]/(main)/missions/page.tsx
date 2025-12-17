"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { toast } from "sonner";
import { motion } from "framer-motion";

type MissionStats = {
  earned_total?: number; // 총 적립(승인된 보상 크레딧 합)
  pending?: number; // 심사중
  approved?: number; // 승인
  rejected?: number; // 반려

  // ✅ 이번 주(월 00:00 KST ~) 제출 카운트 (stats API가 내려줘야 함)
  submitted_week?: number;
};

type SubmitResponse = {
  ok: boolean;
  message?: string;
};

const PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X (Twitter)" },
  { key: "threads", label: "Threads" },
  { key: "facebook", label: "Facebook" },
  { key: "etc", label: "기타" },
] as const;

// ✅ 정책: 제출 상한 = 보상 상한 (주 단위만)
// - 주 3건까지 제출 가능 (승인되면 건당 5 크레딧)
// - 매주 월요일 00:00(KST) 리셋
const POLICY = {
  rewardCreditsPerApprove: 5,
  submissions: {
    perWeek: 3,
  },
  capture: {
    maxCount: 3,
    maxSizeMB: 10,
  },
  review: {
    etaHoursText: "24~48시간",
  },
} as const;

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

/** KST(UTC+9) 기준으로 “이번 주 시작(월 00:00)” / “다음 리셋(다음주 월 00:00)” 계산 */
const KST_OFFSET_MIN = 9 * 60;

function getNowKstShifted() {
  // "KST 시간을 UTC 필드로 표현하는" 쉬프트된 Date
  return new Date(Date.now() + KST_OFFSET_MIN * 60 * 1000);
}

function getStartOfWeekKstShifted(dKstShifted: Date) {
  const d = new Date(dKstShifted);
  // KST가 UTC필드로 들어가 있으니 getUTCDay 사용 (0=일,1=월,...)
  const day = d.getUTCDay();
  const daysSinceMonday = (day + 6) % 7; // 월=0, 화=1 ... 일=6
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

function formatKstResetLabel(dKstShifted: Date) {
  // dKstShifted의 UTC 필드가 곧 KST 시간이라, UTC 기반으로 문자열을 뽑아도 됨
  const y = dKstShifted.getUTCFullYear();
  const m = String(dKstShifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dKstShifted.getUTCDate()).padStart(2, "0");
  const hh = String(dKstShifted.getUTCHours()).padStart(2, "0");
  const mm = String(dKstShifted.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${dd} ${hh}:${mm} (KST)`;
}

function formatRemain(ms: number) {
  if (ms <= 0) return "곧 리셋됩니다";
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
        "rounded-2xl border border-neutral-200/80 dark:border-white/15",
        "bg-white/80 dark:bg-black/35 backdrop-blur",
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

function MiniNotice({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "neutral" | "info" | "warn";
}) {
  const toneCls =
    tone === "warn"
      ? "border-amber-200/80 dark:border-amber-300/20 bg-amber-50/70 dark:bg-amber-400/5"
      : tone === "info"
      ? "border-blue-200/70 dark:border-blue-300/20 bg-blue-50/60 dark:bg-blue-400/5"
      : "border-neutral-200/70 dark:border-white/12 bg-neutral-50/70 dark:bg-black/30";

  return (
    <div className={cn("rounded-2xl border p-3", toneCls)}>
      <div className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200">
        {title}
      </div>
      <div className="mt-1.5 text-[12px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const { session } = useSession();
  const router = useRouter();

  // 로그인 가드
  useEffect(() => {
    if (!session) router.push("/login");
  }, [session, router]);

  // stats
  const [stats, setStats] = useState<MissionStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const refreshStats = async () => {
    if (!session) return;
    try {
      setLoadingStats(true);
      const res = await fetch("/api/missions/stats", {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as MissionStats;
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingStats(true);
        const res = await fetch("/api/missions/stats", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as MissionStats;
        if (!cancelled) setStats(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  // ✅ 주간 제한 계산
  const submittedWeek = stats?.submitted_week ?? 0;
  const submitCapReached = submittedWeek >= POLICY.submissions.perWeek;
  const remainingSubmitWeek = Math.max(0, POLICY.submissions.perWeek - submittedWeek);

  // ✅ 다음 리셋(월 00:00 KST) 안내/카운트다운
  const [resetInfo, setResetInfo] = useState<{
    nextLabel: string;
    remainText: string;
  }>(() => {
    const now = getNowKstShifted();
    const next = getNextResetKstShifted(now);
    return {
      nextLabel: formatKstResetLabel(next),
      remainText: formatRemain(next.getTime() - now.getTime()),
    };
  });

  useEffect(() => {
    const tick = () => {
      const now = getNowKstShifted();
      const next = getNextResetKstShifted(now);
      setResetInfo({
        nextLabel: formatKstResetLabel(next),
        remainText: formatRemain(next.getTime() - now.getTime()),
      });
    };

    tick();
    const id = window.setInterval(tick, 1000 * 30); // 30초마다 갱신
    return () => window.clearInterval(id);
  }, []);

  // 업로드 폼
  const [platform, setPlatform] =
    useState<(typeof PLATFORMS)[number]["key"]>("instagram");
  const [postUrl, setPostUrl] = useState("");
  const [note, setNote] = useState("");

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

    // 최대 N장
    const merged = [...files, ...next].slice(0, POLICY.capture.maxCount);
    setFiles(merged);

    // 같은 파일 다시 선택 가능하게 input value 초기화
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  // ✅ 제출 가능 조건 (주간 상한만)
  const canSubmit = files.length > 0 && !submitting && !submitCapReached;

  const submit = async () => {
    if (!session) return router.push("/login");
    if (!canSubmit) return;

    // URL은 선택사항. 넣으면 최소 형식 체크
    if (postUrl.trim() && !/^https?:\/\//i.test(postUrl.trim())) {
      toast.error("게시물 링크는 http(s)로 시작하는 URL 형식으로 입력해 주세요.");
      return;
    }

    // ✅ 프론트에서 한 번 더 방어
    if (submitCapReached) {
      toast.error(
        `이번 주 제출 제한(${POLICY.submissions.perWeek}건)에 도달했습니다. 다음 리셋 이후에 다시 제출해 주세요.`
      );
      return;
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("platform", platform);
      fd.append("postUrl", postUrl.trim());
      fd.append("note", note.trim());
      files.forEach((f) => fd.append("captures", f));

      // ✅ 서버도 동일 기준으로 반드시 검증해야 함
      fd.append("clientPolicy_weeklyLimit", String(POLICY.submissions.perWeek));
      fd.append(
        "clientPolicy_rewardCreditsPerApprove",
        String(POLICY.rewardCreditsPerApprove)
      );

      const res = await fetch("/api/missions/submit", {
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
        toast.error(data?.message ?? "제출에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      toast.success("제출이 완료되었습니다. 검토 후 승인 시 보상 크레딧이 지급됩니다.");

      setFiles([]);
      setPostUrl("");
      setNote("");

      await refreshStats();
    } catch {
      toast.error("제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#f4f6fb] dark:bg-[#020617] overflow-hidden">
      {/* BG */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-[radial-gradient(900px_500px_at_85%_-10%,rgb(var(--hero-a)_/_0.22),transparent_65%),radial-gradient(700px_420px_at_5%_0%,rgb(var(--hero-b)_/_0.20),transparent_60%)]
          bg-blend-normal
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]
          bg-[linear-gradient(to_right,rgb(var(--hero-grid)_/_0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--hero-grid)_/_0.04)_1px,transparent_1px)]
          bg-[size:24px_24px]
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10 hidden dark:block
          bg-[linear-gradient(180deg,#0a0f1c_0%,#05070e_55%,#030408_100%)]
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10 hidden dark:block
          bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(0,0,0,0.55),transparent_65%)]
        "
      />

      {/* Header */}
      <header className="mx-auto max-w-5xl px-6 md:px-10 pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm backdrop-blur dark:bg-black/40 dark:border-white/15 dark:text-neutral-200">
          미션 센터
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
              미션 참여로 보상 크레딧 받기
            </h1>
            <p className="mt-2 text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-2xl">
              Brify를 SNS에 공유한 뒤 게시물 캡처를 업로드하시면, 검토 후{" "}
              <span className="font-semibold text-blue-700 dark:text-[rgb(var(--hero-b))]">
                {POLICY.rewardCreditsPerApprove} 크레딧
              </span>
              을 지급합니다.
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
              요약하기
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 md:px-10 pb-24">
        {/* Summary */}
        <section className="mt-6">
          <div
            className="
              rounded-3xl border border-neutral-200/80 dark:border-white/15
              bg-white/90 dark:bg-black/45
              backdrop-blur
              px-5 py-5 sm:px-6 sm:py-6
              shadow-[0_18px_45px_-26px_rgba(15,23,42,0.20)]
            "
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  <span
                    className="
                      inline-flex h-7 w-7 items-center justify-center
                      rounded-full
                      bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500
                      text-[11px] font-semibold text-white
                    "
                  >
                    RC
                  </span>
                  <span>내 미션 현황</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatPill
                    label="심사중"
                    value={String(stats?.pending ?? 0)}
                    loading={loadingStats}
                  />
                  <StatPill
                    label="승인"
                    value={String(stats?.approved ?? 0)}
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

                {/* ✅ 주간 제한 + 리셋 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatPill
                    label={`이번 주 제출(남은 ${remainingSubmitWeek})`}
                    value={`${submittedWeek}/${POLICY.submissions.perWeek}`}
                    loading={loadingStats}
                    strong={!submitCapReached}
                  />
                  <div className="sm:col-span-3 rounded-2xl border border-neutral-200/80 dark:border-white/15 bg-white/80 dark:bg-black/35 backdrop-blur px-3 py-2">
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      주간 리셋 (매주 월요일 00:00 KST)
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      다음 리셋: {resetInfo.nextLabel}
                      <span className="ml-2 text-xs font-medium text-neutral-500 dark:text-neutral-300">
                        · 남은 시간 {resetInfo.remainText}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                  제출 후 보통 <span className="font-semibold">{POLICY.review.etaHoursText}</span>{" "}
                  내에 검토됩니다. (상황에 따라 달라질 수 있습니다)
                </p>
              </div>

              <div className="sm:text-right">
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  승인 시 보상
                </div>
                <div className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
                  +{POLICY.rewardCreditsPerApprove}{" "}
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-300">
                    크레딧
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                  주 {POLICY.submissions.perWeek}건까지 (제출/보상 상한 동일)
                </div>
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
              backdrop-blur
              p-5 sm:p-6
            "
          >
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              미션 참여 방법
            </h2>
            <p className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-300">
              아래 순서대로 진행해 주세요. 캡처는 최대 {POLICY.capture.maxCount}장까지 업로드할 수 있습니다.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              {[
                "Brify를 소개하는 글(후기/사용 화면 포함)을 SNS에 게시합니다.",
                "게시물이 보이도록 캡처합니다. (아이디/게시일/내용이 보이면 좋습니다)",
                "이 페이지에서 캡처 이미지를 업로드합니다.",
                "검토 후 승인되면 보상 크레딧이 지급됩니다.",
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
              <MiniNotice title="제출 제한 및 리셋" tone="info">
                • 주간 제출 제한: <b>주 {POLICY.submissions.perWeek}건</b>
                <br />
                • 리셋: <b>매주 월요일 00:00 (KST)</b>
                <br />
                • 제출 상한과 보상 상한을 동일하게 운영합니다.
              </MiniNotice>

              <MiniNotice title="체크 포인트">
                <ul className="flex flex-col gap-1.5 list-disc pl-5">
                  <li>게시물이 실제로 공개/확인 가능한 상태여야 합니다.</li>
                  <li>개인정보가 포함된 경우 제출 전에 가림 처리해 주세요.</li>
                  <li>동일 게시물/동일 링크/동일 캡처의 반복 제출은 반려될 수 있습니다.</li>
                </ul>
              </MiniNotice>
            </div>
          </div>

          {/* Right: Upload */}
          <div
            className="
              rounded-3xl border border-neutral-200/80 dark:border-white/15
              bg-white/85 dark:bg-black/40
              backdrop-blur
              p-5 sm:p-6
            "
          >
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              캡처 업로드
            </h2>
            <p className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-300">
              캡처 이미지(최대 {POLICY.capture.maxCount}장)를 업로드하시면, 검토 후 승인 시 보상 크레딧이 지급됩니다.
            </p>

            <div className="mt-5 grid gap-3">
              {/* platform */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                  플랫폼
                </label>
                <select
                  value={platform}
                  onChange={(e) =>
                    setPlatform(e.target.value as (typeof PLATFORMS)[number]["key"])
                  }
                  className="
                    mt-1 w-full rounded-2xl
                    border border-neutral-200/80 dark:border-white/15
                    bg-white/90 dark:bg-black/40
                    px-3 py-2 text-sm
                    text-neutral-900 dark:text-neutral-50
                    outline-none
                    focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-[rgb(var(--hero-b))]/35
                  "
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* post url */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                  게시물 링크 (선택)
                </label>
                <input
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://..."
                  className="
                    mt-1 w-full rounded-2xl
                    border border-neutral-200/80 dark:border-white/15
                    bg-white/90 dark:bg-black/40
                    px-3 py-2 text-sm
                    text-neutral-900 dark:text-neutral-50
                    placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                    outline-none
                    focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-[rgb(var(--hero-b))]/35
                  "
                />
              </div>

              {/* note */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                  메모 (선택)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="예: 게시물에 포함한 문구 / 추가로 확인이 필요한 사항"
                  rows={3}
                  className="
                    mt-1 w-full rounded-2xl
                    border border-neutral-200/80 dark:border-white/15
                    bg-white/90 dark:bg-black/40
                    px-3 py-2 text-sm
                    text-neutral-900 dark:text-neutral-50
                    placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                    outline-none
                    focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-[rgb(var(--hero-b))]/35
                  "
                />
              </div>

              {/* upload area */}
              <div>
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
                    "w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                    submitCapReached
                      ? "bg-neutral-200 text-neutral-500 dark:bg-white/10 dark:text-neutral-500 cursor-not-allowed"
                      : "border border-neutral-200/80 dark:border-white/15 bg-white/90 dark:bg-black/35 text-neutral-900 dark:text-neutral-50 hover:-translate-y-0.5 hover:shadow-md"
                  )}
                >
                  캡처 이미지 선택 (최대 {POLICY.capture.maxCount}장)
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
                    ? "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]"
                    : "bg-neutral-200 text-neutral-500 dark:bg-white/10 dark:text-neutral-500 cursor-not-allowed"
                )}
              >
                {submitting ? "제출 중..." : "제출하기"}
              </motion.button>

              <MiniNotice title="반려되는 대표 사례">
                <ul className="flex flex-col gap-1.5 list-disc pl-5">
                  <li>캡처에서 게시물 식별이 어려운 경우 (내용/계정/화면이 불분명)</li>
                  <li>동일 게시물/동일 링크/동일 캡처를 반복 제출한 경우</li>
                  <li>정책 위반 또는 스팸성 홍보로 판단되는 경우</li>
                </ul>
              </MiniNotice>
            </div>
          </div>
        </section>

        {/* Footer hint */}
        <section className="mt-8">
          <div
            className="
              rounded-3xl border border-neutral-200/80 dark:border-white/15
              bg-white/80 dark:bg-black/35
              backdrop-blur
              p-4 sm:p-5
              text-xs sm:text-sm text-neutral-700 dark:text-neutral-200
            "
          >
            <div className="font-semibold">TIP</div>
            <div className="mt-1.5">
              게시물에 Brify 링크를 함께 남기면 검토가 더 빠르게 진행될 수 있습니다. (필수 아님)
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
