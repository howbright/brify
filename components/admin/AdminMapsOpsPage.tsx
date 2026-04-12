"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

type QueueStatsResponse = {
  queue: string;
  counts: {
    waiting: number;
    active: number;
    delayed: number;
    prioritized: number;
    paused: number;
    failed: number;
    completed: number;
  };
  backlog: number;
  generatedAt: string;
};

type GenerationStatsResponse = {
  window: {
    hours: number;
    startAt: string;
    endAt: string;
  };
  recent: {
    total: number;
    done: number;
    failed: number;
    inProgress: number;
    failureRate: number;
    avgAiProcessingMs: number;
    p95AiProcessingMs: number;
    maxAiProcessingMs: number;
  };
  current: {
    queued: number;
    processing: number;
    failed: number;
    done: number;
  };
};

type FailedJobsResponse = {
  items: Array<{
    id: string;
    title: string;
    shortTitle: string | null;
    sourceType: "youtube" | "website" | "file" | "manual";
    sourceUrl: string | null;
    extractError: string | null;
    extractJobId: string | null;
    aiProcessingMs: number | null;
    createdAt: string;
    updatedAt: string;
  }>;
  limit: number;
};

type OpsHistoryResponse = {
  window: {
    hours: number;
    startAt: string;
    endAt: string;
  };
  points: Array<{
    capturedAt: string;
    backlog: number;
    active: number;
    failureRate24h: number;
    avgAiProcessingMs24h: number;
    p95AiProcessingMs24h: number;
    maxAiProcessingMs24h: number;
    currentProcessing: number;
    currentFailed: number;
    currentQueued: number;
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatMs(ms: number | null | undefined) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatShortTime(value: string) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildLinePath(values: number[], width: number, height: number) {
  if (!values.length) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function HistoryChart({
  title,
  description,
  points,
  getValue,
  valueFormatter,
  stroke,
}: {
  title: string;
  description: string;
  points: OpsHistoryResponse["points"];
  getValue: (point: OpsHistoryResponse["points"][number]) => number;
  valueFormatter: (value: number) => string;
  stroke: string;
}) {
  const values = points.map(getValue);
  const latestValue = values.length ? values[values.length - 1] : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const path = buildLinePath(values, 100, 44);
  const areaPath = path ? `M 0 44 ${path.slice(1)} L 100 44 Z` : "";
  const gradientId = `gradient-${title.replace(/\s+/g, "-").toLowerCase()}`;
  const firstLabel = points.length ? formatShortTime(points[0].capturedAt) : "-";
  const lastLabel = points.length ? formatShortTime(points[points.length - 1].capturedAt) : "-";

  return (
    <div className="rounded-[28px] border border-slate-300 bg-white/92 p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-neutral-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
            Latest
          </div>
          <div className="mt-1 text-lg font-extrabold tracking-tight text-neutral-950">
            {valueFormatter(latestValue)}
          </div>
          <div className="text-[11px] text-neutral-500">최대 {valueFormatter(maxValue)}</div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        {points.length > 1 ? (
          <svg viewBox="0 0 100 44" className="h-36 w-full overflow-visible">
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              opacity="0.7"
            />
            <path
              d={path}
              fill="none"
              stroke={stroke}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div className="flex h-36 items-center justify-center text-sm text-neutral-500">
            그래프를 그리기엔 아직 스냅샷이 부족해요.
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
          <span>{firstLabel}</span>
          <span>{lastLabel}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
  description,
}: {
  label: string;
  value: string;
  tone?: "default" | "danger" | "success" | "warn";
  description?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border px-5 py-4 shadow-sm",
        tone === "default" && "border-slate-300 bg-white/90",
        tone === "danger" && "border-rose-200 bg-rose-50/90",
        tone === "success" && "border-emerald-200 bg-emerald-50/90",
        tone === "warn" && "border-amber-200 bg-amber-50/90"
      )}
    >
      <div className="text-xs font-medium text-neutral-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-neutral-950">
        {value}
      </div>
      {description ? (
        <div className="mt-1 text-xs leading-5 text-neutral-500">{description}</div>
      ) : null}
    </div>
  );
}

export default function AdminMapsOpsPage() {
  const pathname = usePathname();
  const [queueStats, setQueueStats] = useState<QueueStatsResponse | null>(null);
  const [generationStats, setGenerationStats] = useState<GenerationStatsResponse | null>(null);
  const [failedJobs, setFailedJobs] = useState<FailedJobsResponse | null>(null);
  const [opsHistory, setOpsHistory] = useState<OpsHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchAdminOps() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl) {
          throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았어요.");
        }

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const accessToken = session?.access_token;
        if (!accessToken) {
          throw new Error("관리자 세션을 찾지 못했어요. 다시 로그인해 주세요.");
        }

        const headers = {
          Authorization: `Bearer ${accessToken}`,
        };

        const [queueRes, statsRes, failedRes, historyRes] = await Promise.all([
          fetch(`${baseUrl}/admin/maps/queue-stats`, {
            method: "GET",
            headers,
            cache: "no-store",
          }),
          fetch(`${baseUrl}/admin/maps/generation-stats?hours=24`, {
            method: "GET",
            headers,
            cache: "no-store",
          }),
          fetch(`${baseUrl}/admin/maps/failed-jobs?limit=20`, {
            method: "GET",
            headers,
            cache: "no-store",
          }),
          fetch(`${baseUrl}/admin/maps/ops-history?hours=24`, {
            method: "GET",
            headers,
            cache: "no-store",
          }),
        ]);

        if ([queueRes, statsRes, failedRes, historyRes].some((res) => res.status === 401)) {
          throw new Error("인증이 만료되었어요. 다시 로그인해 주세요.");
        }

        if ([queueRes, statsRes, failedRes, historyRes].some((res) => res.status === 403)) {
          throw new Error("관리자 권한이 필요해요.");
        }

        if (!queueRes.ok || !statsRes.ok || !failedRes.ok || !historyRes.ok) {
          throw new Error("운영 데이터를 불러오지 못했어요.");
        }

        const [queueJson, statsJson, failedJson, historyJson] = (await Promise.all([
          queueRes.json(),
          statsRes.json(),
          failedRes.json(),
          historyRes.json(),
        ])) as [
          QueueStatsResponse,
          GenerationStatsResponse,
          FailedJobsResponse,
          OpsHistoryResponse,
        ];

        if (cancelled) return;

        setQueueStats(queueJson);
        setGenerationStats(statsJson);
        setFailedJobs(failedJson);
        setOpsHistory(historyJson);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요.");
          setQueueStats(null);
          setGenerationStats(null);
          setFailedJobs(null);
          setOpsHistory(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchAdminOps();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const cards = useMemo(() => {
    if (!queueStats || !generationStats) return [];

    return [
      {
        label: "현재 backlog",
        value: `${queueStats.backlog.toLocaleString()}개`,
        tone: queueStats.backlog >= 20 ? "danger" : queueStats.backlog >= 10 ? "warn" : "success",
        description: "waiting + active + delayed + prioritized",
      },
      {
        label: "활성 worker 처리량",
        value: `${queueStats.counts.active.toLocaleString()}개`,
        tone: "default" as const,
        description: "지금 처리 중인 job 수",
      },
      {
        label: "24시간 실패율",
        value: `${(generationStats.recent.failureRate * 100).toFixed(1)}%`,
        tone:
          generationStats.recent.failureRate >= 0.2
            ? "danger"
            : generationStats.recent.failureRate >= 0.1
              ? "warn"
              : "success",
        description: `${generationStats.recent.failed.toLocaleString()} / ${generationStats.recent.total.toLocaleString()}건`,
      },
      {
        label: "평균 AI 처리시간",
        value: formatMs(generationStats.recent.avgAiProcessingMs),
        tone: "default" as const,
        description: "최근 24시간 avg_ai_processing_ms",
      },
      {
        label: "P95 AI 처리시간",
        value: formatMs(generationStats.recent.p95AiProcessingMs),
        tone: "default" as const,
        description: "느린 구간 체감용",
      },
      {
        label: "현재 실패 맵",
        value: `${generationStats.current.failed.toLocaleString()}개`,
        tone: generationStats.current.failed > 0 ? "warn" : "success",
        description: "현재 failed 상태 총 개수",
      },
    ] as const;
  }, [queueStats, generationStats]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_500px_at_88%_-10%,rgba(14,165,233,0.16),transparent_65%),radial-gradient(760px_460px_at_0%_0%,rgba(59,130,246,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_78%)]" />

      <header className="mx-auto max-w-7xl px-6 pt-20 md:px-10 md:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-slate-800 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)]">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          ADMIN MAP OPS
        </div>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-neutral-950 sm:text-[30px]">
              구조맵 운영 현황
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600 sm:text-base">
              큐 적체, 최근 처리시간, 실패율, 실패 맵 목록을 한 화면에서 확인하는 운영 대시보드예요.
            </p>
            <div className="mt-4 rounded-[24px] border border-slate-300 bg-white/80 px-4 py-4 text-sm leading-6 text-neutral-700 shadow-sm sm:px-5">
              <div className="font-semibold text-neutral-900">
                현재 운영 구성: API 서버 1개 + worker 5개
              </div>
              <div className="mt-2">
                지금 기준에서 backlog가 짧고 P95 처리시간이 안정적이면 현재 worker 수를 유지해도 괜찮아요.
                반대로 backlog가 자주 10을 넘고 20에 가까워지거나, active가 오랫동안 5 근처를 유지하면서
                P95 처리시간이 계속 늘어나면 worker를 더 늘리는 쪽을 검토하는 게 좋아요.
              </div>
              <div className="mt-2">
                실패율이 일시적으로 튀는 건 외부 장애일 수 있지만, 24시간 실패율이 10%를 자주 넘으면 OpenAI
                모델, 프롬프트, 재시도 정책, 결제 상태, 입력 품질을 먼저 점검하는 게 좋아요.
              </div>
              <div className="mt-2">
                권장 해석 기준:
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-600">
                <li>backlog 0~9: 안정 구간, 현재 worker 유지</li>
                <li>backlog 10~19가 자주 반복: worker 증설 검토 시작</li>
                <li>backlog 20 이상이 지속: 신규 생성 제한 또는 worker 즉시 증설 고려</li>
                <li>active가 장시간 5에 고정: worker가 포화 상태일 가능성 높음</li>
                <li>P95 AI 처리시간이 계속 상승: 모델/입력 분포/worker 수 함께 점검</li>
                <li>24시간 실패율 10% 이상 반복: 장애 원인 분석 우선, 20% 이상이면 즉시 점검</li>
              </ul>
              <div className="mt-4 font-semibold text-neutral-900">
                현재 들어가 있는 안정화 처리
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-600">
                <li>OpenAI 응답 형식이 깨지면 내부 재시도 최대 2회</li>
                <li>BullMQ job 재시도 최대 5회</li>
                <li>서버 재기동 시 processing / failed 맵 자동 복구</li>
                <li>수동 복구 API로 운영 중에도 재큐잉 가능</li>
                <li>
                  복구는 Postgres advisory lock으로 한 인스턴스만 수행
                  <span className="ml-1 text-neutral-500">
                    (운영 env: <code>MAP_RECOVERY_ON_BOOTSTRAP</code>, API 서버 1개만
                    <code className="ml-1">true</code>, worker들은
                    <code className="ml-1">false</code>)
                  </span>
                </li>
                <li>5분마다 운영 스냅샷 자동 저장 중</li>
              </ul>
              <div className="mt-4 font-semibold text-neutral-900">
                큐 cap 운영 기준
              </div>
              <div className="mt-2 text-neutral-600">
                현재 backlog 20을 운영 cap 기준으로 보고 있어요. 다만 이 숫자는 지금 대시보드에서
                경고 기준으로 쓰는 값이고, 신규 생성 요청을 자동 차단하는 강제 로직은 아직 들어가 있지
                않아요. 그래서 backlog가 20에 자주 닿는다면 worker를 늘리거나, 다음 단계로 실제 생성 차단
                로직을 넣는 걸 검토해야 해요.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={pathname.replace(/\/ops\/maps$/, "") || "/admin"}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              관리자 홈
            </Link>
            <Link
              href={pathname.replace(/\/ops\/maps$/, "/refund")}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              환불 화면
            </Link>
            <button
              type="button"
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-24 md:px-10">
        {errorMessage ? (
          <section className="mt-8 rounded-3xl border border-rose-200 bg-rose-50/90 px-5 py-4 text-sm text-rose-700 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="font-semibold">운영 데이터를 불러오지 못했어요.</div>
                <div className="mt-1 leading-6">{errorMessage}</div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              tone={card.tone}
              description={card.description}
            />
          ))}
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-2">
          <HistoryChart
            title="Backlog 추이"
            description="5분 단위로 쌓인 전체 backlog 추이예요."
            points={opsHistory?.points ?? []}
            getValue={(point) => point.backlog}
            valueFormatter={(value) => `${value.toLocaleString()}개`}
            stroke="#2563eb"
          />
          <HistoryChart
            title="Active 추이"
            description="실제로 worker가 처리 중인 job 수 추이예요."
            points={opsHistory?.points ?? []}
            getValue={(point) => point.active}
            valueFormatter={(value) => `${value.toLocaleString()}개`}
            stroke="#0f766e"
          />
          <HistoryChart
            title="24시간 실패율 추이"
            description="최근 24시간 failure rate가 어떻게 변하는지 확인해요."
            points={opsHistory?.points ?? []}
            getValue={(point) => point.failureRate24h * 100}
            valueFormatter={(value) => `${value.toFixed(1)}%`}
            stroke="#dc2626"
          />
          <HistoryChart
            title="P95 AI 처리시간 추이"
            description="느린 구간 체감을 보기 위한 P95 처리시간 추이예요."
            points={opsHistory?.points ?? []}
            getValue={(point) => point.p95AiProcessingMs24h}
            valueFormatter={(value) => formatMs(value)}
            stroke="#7c3aed"
          />
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[28px] border border-slate-300 bg-white/92 p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
                  현재 큐 상태
                </h2>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  큐 backlog가 20에 가까워지면 체감 대기 시간이 길어질 수 있어요.
                </p>
              </div>
              <div className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {queueStats?.queue ?? "map_generate"}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="waiting" value={`${queueStats?.counts.waiting ?? 0}`} />
              <StatCard label="active" value={`${queueStats?.counts.active ?? 0}`} />
              <StatCard label="delayed" value={`${queueStats?.counts.delayed ?? 0}`} />
              <StatCard label="prioritized" value={`${queueStats?.counts.prioritized ?? 0}`} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatCard label="failed" value={`${queueStats?.counts.failed ?? 0}`} tone="warn" />
              <StatCard label="completed" value={`${queueStats?.counts.completed ?? 0}`} />
              <StatCard label="paused" value={`${queueStats?.counts.paused ?? 0}`} />
            </div>

            <div className="mt-4 text-xs text-neutral-500">
              마지막 집계 시각: {formatDateTime(queueStats?.generatedAt ?? null)}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-300 bg-white/92 p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] sm:p-6">
            <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
              최근 24시간 생성 통계
            </h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              최근 생성량과 처리 속도를 같이 봐야 worker 수 조정을 판단할 수 있어요.
            </p>

            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <dt className="text-sm font-medium text-neutral-600">최근 생성 요청</dt>
                <dd className="text-base font-extrabold text-neutral-950">
                  {generationStats?.recent.total.toLocaleString() ?? 0}건
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <dt className="text-sm font-medium text-neutral-600">최근 완료</dt>
                <dd className="text-base font-extrabold text-neutral-950">
                  {generationStats?.recent.done.toLocaleString() ?? 0}건
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <dt className="text-sm font-medium text-neutral-600">최근 실패</dt>
                <dd className="text-base font-extrabold text-neutral-950">
                  {generationStats?.recent.failed.toLocaleString() ?? 0}건
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <dt className="text-sm font-medium text-neutral-600">평균 AI 처리시간</dt>
                <dd className="text-base font-extrabold text-neutral-950">
                  {formatMs(generationStats?.recent.avgAiProcessingMs)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <dt className="text-sm font-medium text-neutral-600">P95 AI 처리시간</dt>
                <dd className="text-base font-extrabold text-neutral-950">
                  {formatMs(generationStats?.recent.p95AiProcessingMs)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <dt className="text-sm font-medium text-neutral-600">최대 AI 처리시간</dt>
                <dd className="text-base font-extrabold text-neutral-950">
                  {formatMs(generationStats?.recent.maxAiProcessingMs)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-300 bg-white/92 p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
                최근 실패 맵
              </h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                최근 실패한 맵의 제목, 에러 메시지, 처리 시간을 확인해 원인을 빠르게 좁힐 수 있어요.
              </p>
            </div>
            <div className="text-xs text-neutral-500">
              최대 {failedJobs?.limit ?? 20}건
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loading && !failedJobs ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-neutral-500">
                운영 데이터를 불러오는 중이에요...
              </div>
            ) : failedJobs && failedJobs.items.length > 0 ? (
              failedJobs.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-4 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.42)]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                        FAILED
                      </div>
                      <div className="mt-2 truncate text-base font-extrabold tracking-tight text-neutral-950 sm:text-lg">
                        {item.shortTitle ?? item.title}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        mapId {item.id} · {item.sourceType} · job {item.extractJobId ?? "-"}
                      </div>
                    </div>

                    <div className="lg:min-w-[180px] lg:text-right">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-700">
                        마지막 실패 시각
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-neutral-950">
                        {formatDateTime(item.updatedAt)}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        처리시간 {formatMs(item.aiProcessingMs)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm leading-6 text-neutral-700">
                    {item.extractError ?? "에러 메시지 없음"}
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-neutral-500 sm:grid-cols-2">
                    <div>생성일 {formatDateTime(item.createdAt)}</div>
                    <div className="break-all">source URL {item.sourceUrl ?? "-"}</div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-5 text-sm text-emerald-700">
                최근 실패 맵이 없어요.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
