"use client";

import { useEffect, useState } from "react";

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

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusPill({ status }: { status: MissionSubmissionStatus }) {
  const map = {
    pending: {
      label: "검토중",
      cls: "border-neutral-200/70 bg-white/70 text-neutral-700 dark:border-white/12 dark:bg-white/5 dark:text-neutral-200",
    },
    approved: {
      label: "승인",
      cls: "border-emerald-200/70 bg-emerald-50/70 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/5 dark:text-emerald-200",
    },
    rejected: {
      label: "반려",
      cls: "border-rose-200/70 bg-rose-50/70 text-rose-800 dark:border-rose-300/20 dark:bg-rose-400/5 dark:text-rose-200",
    },
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold",
        map.cls
      )}
    >
      {map.label}
    </span>
  );
}

export default function MissionHistoryPanel() {
  const [items, setItems] = useState<MissionSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
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

  return (
    <div>
      <div className="mt-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
          내 보상 제출 내역
        </h1>
        <p className="mt-2 text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-2xl">
          내가 제출했던 미션들의 상태(검토중/승인/반려)를 확인할 수 있어.
        </p>
      </div>

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
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              최근 제출 목록
            </div>
            <button
              type="button"
              onClick={fetchHistory}
              className="
                inline-flex items-center justify-center rounded-2xl
                border border-neutral-200/80 bg-white/90 px-3 py-2
                text-[12px] font-semibold text-neutral-900
                hover:-translate-y-0.5 hover:shadow-md
                transition-all
                dark:border-white/15 dark:bg-black/40 dark:text-neutral-50
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
                    rounded-2xl border border-neutral-200/70 dark:border-white/12
                    bg-white/70 dark:bg-white/5
                    p-4
                  "
                >
                  <div className="h-4 w-40 rounded bg-neutral-200/70 dark:bg-white/10" />
                  <div className="mt-2 h-3 w-64 rounded bg-neutral-200/70 dark:bg-white/10" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-5 text-sm text-neutral-600 dark:text-neutral-300">
              아직 제출 내역이 없어.
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-2">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="
                    rounded-2xl border border-neutral-200/70 dark:border-white/12
                    bg-white/70 dark:bg-white/5
                    p-4
                  "
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50">
                          {it.platform}
                        </div>
                        <StatusPill status={it.status} />
                      </div>
                      <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {formatDateTime(it.created_at)}
                      </div>
                    </div>

                    {it.post_url ? (
                      <a
                        href={it.post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="
                          text-[12px] font-semibold
                          text-blue-700 hover:underline
                          dark:text-[rgb(var(--hero-b))]
                        "
                      >
                        링크 열기
                      </a>
                    ) : null}
                  </div>

                  {it.note ? (
                    <div className="mt-3 text-[12px] text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                      {it.note}
                    </div>
                  ) : null}

                  {it.status === "rejected" && it.reject_reason ? (
                    <div className="mt-3 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-3 text-[12px] text-rose-800 dark:border-rose-300/20 dark:bg-rose-400/5 dark:text-rose-200">
                      <div className="font-semibold">반려 사유</div>
                      <div className="mt-1 whitespace-pre-wrap">{it.reject_reason}</div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
