"use client";

import { useEffect, useMemo, useState } from "react";

type MissionSubmissionStatus = "pending" | "approved" | "rejected";

type MissionSubmission = {
  id: string;
  created_at: string; // ISO
  platform: string;
  post_url?: string | null;
  note?: string | null;
  status: MissionSubmissionStatus;
  reject_reason?: string | null;
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function formatSubmittedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  // “12월 17일 13:05”처럼
  return d.toLocaleString(undefined, {
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X (Twitter)",
  threads: "Threads",
  facebook: "Facebook",
  etc: "기타",
};

function displayPlatform(p: string) {
  const key = (p ?? "").toLowerCase();
  return PLATFORM_LABELS[key] ?? p;
}

function StatusPill({ status }: { status: MissionSubmissionStatus }) {
  const map = {
    pending: {
      label: "검토 중",
      pill: "border-slate-400 bg-white text-neutral-700 dark:border-white/20 dark:bg-white/[0.08] dark:text-neutral-200",
    },
    approved: {
      label: "승인",
      // ✅ 승인만 확실히 눈에 띄게
      pill: "border-emerald-600 bg-emerald-600 text-white shadow-sm dark:border-emerald-400/30 dark:bg-emerald-500/25 dark:text-emerald-100",
    },
    rejected: {
      label: "반려",
      pill: "border-rose-600 bg-rose-600 text-white shadow-sm dark:border-rose-400/30 dark:bg-rose-500/25 dark:text-rose-100",
    },
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold tracking-tight",
        map.pill
      )}
    >
      {map.label}
    </span>
  );
}

function StatusStripe({ status }: { status: MissionSubmissionStatus }) {
  const cls =
    status === "approved"
      ? "bg-emerald-500"
      : status === "rejected"
      ? "bg-rose-500"
      : "bg-neutral-300 dark:bg-white/15";

  return (
    <span aria-hidden className={cn("absolute left-0 top-0 h-full w-1.5", cls)} />
  );
}

/** ✅ 가데이터 (UI 확인용) */
const MOCK_ITEMS: MissionSubmission[] = [
  {
    id: "m_001",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    platform: "instagram",
    status: "approved",
    note: "Brify 사용 후기와 함께 기능 설명을 포함해 게시했습니다.",
  },
  {
    id: "m_002",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    platform: "youtube",
    status: "pending",
    note: "영상 설명란에 Brify 링크를 추가했습니다.",
  },
  {
    id: "m_003",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
    platform: "x",
    status: "rejected",
    reject_reason:
      "게시물 식별이 어려워 재제출이 필요합니다. 캡처에 계정/게시일/내용이 보이도록 다시 제출해 주세요.",
  },
];

/** ✅ 여기만 false로 바꾸면 API 모드로 전환됩니다 */
const USE_MOCK = true;

export default function MissionHistoryPanel() {
  const [items, setItems] = useState<MissionSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      if (USE_MOCK) {
        // 가데이터로 바로 UI 확인
        setItems(MOCK_ITEMS);
        return;
      }

      const res = await fetch("/api/missions/submissions?limit=30", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        setItems([]);
        return;
      }

      const data = (await res.json()) as MissionSubmission[];
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const empty = !loading && items.length === 0;

  // (선택) 승인/검토중/반려 순으로 보기 좋게 정렬
  const sortedItems = useMemo(() => {
    const rank: Record<MissionSubmissionStatus, number> = {
      approved: 0,
      pending: 1,
      rejected: 2,
    };
    return [...items].sort((a, b) => {
      const r = rank[a.status] - rank[b.status];
      if (r !== 0) return r;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [items]);

  return (
    <div>
      <div className="mt-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
          제출 내역
        </h2>
        <p className="mt-2 text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-2xl">
          제출하신 미션의 진행 상태(검토 중/승인/반려)를 확인할 수 있습니다.
        </p>
      </div>

      <section className="mt-6">
        <div
          className="
            rounded-3xl border border-slate-400 dark:border-white/20
            bg-white dark:bg-black/45
            backdrop-blur
            px-5 py-5 sm:px-6 sm:py-6
            shadow-[0_18px_45px_-26px_rgba(15,23,42,0.20)]
          "
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              최근 제출 내역
            </div>

            <button
              type="button"
              onClick={fetchHistory}
              className="
                inline-flex items-center justify-center rounded-2xl
                border border-slate-400 bg-white px-3 py-2
                text-[12px] font-semibold text-neutral-900
                hover:-translate-y-0.5 hover:shadow-md
                transition-all
                dark:border-white/20 dark:bg-black/40 dark:text-neutral-50
              "
            >
              새로고침
            </button>
          </div>

          {loading ? (
            <div className="mt-5 flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="
                    relative overflow-hidden
                    rounded-2xl border border-slate-400 dark:border-white/20
                    bg-white dark:bg-white/[0.08]
                    p-4
                  "
                >
                  <span className="absolute left-0 top-0 h-full w-1.5 bg-slate-400 dark:bg-white/20" />
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-14 rounded-full bg-neutral-200/70 dark:bg-white/10" />
                    <div className="h-4 w-64 rounded bg-neutral-200/70 dark:bg-white/10" />
                  </div>
                  <div className="mt-3 h-3 w-72 rounded bg-neutral-200/70 dark:bg-white/10" />
                </div>
              ))}
            </div>
          ) : empty ? (
            <div className="mt-5 text-sm text-neutral-600 dark:text-neutral-300">
              아직 제출 내역이 없습니다.
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-2">
              {sortedItems.map((it) => {
                const platformLabel = displayPlatform(it.platform);
                const submittedAt = formatSubmittedAt(it.created_at);
                const title = `업로드 플랫폼: ${platformLabel} · ${submittedAt} 제출`;

                return (
                  <div
                    key={it.id}
                    className="
                      relative overflow-hidden
                      rounded-2xl border border-slate-400 dark:border-white/20
                      bg-white dark:bg-white/[0.08]
                      p-4
                    "
                  >
                    <StatusStripe status={it.status} />

                    <div className="flex items-start gap-2">
                      <StatusPill status={it.status} />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50 leading-snug break-words">
                          {title}
                        </div>
                        <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                          제출 ID: {it.id}
                        </div>
                      </div>
                    </div>

                    {it.note ? (
                      <div className="mt-3 text-[12px] text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                        {it.note}
                      </div>
                    ) : null}

                    {it.status === "rejected" && it.reject_reason ? (
                      <div className="mt-3 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-3 text-[12px] text-rose-800 dark:border-rose-300/20 dark:bg-rose-400/5 dark:text-rose-200">
                        <div className="font-semibold">반려 사유</div>
                        <div className="mt-1 whitespace-pre-wrap">
                          {it.reject_reason}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
