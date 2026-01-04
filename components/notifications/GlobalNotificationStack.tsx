// components/notifications/GlobalNotificationsStack.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { NotificationItem, NotificationStatus } from "@/app/types/notice";

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

function getStatusBadgeClassName(status: NotificationStatus) {
  switch (status) {
    case "approved":
      return "border-emerald-200/70 bg-emerald-50/80 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/5 dark:text-emerald-200";
    case "rejected":
      return "border-rose-200/70 bg-rose-50/80 text-rose-800 dark:border-rose-300/20 dark:bg-rose-400/5 dark:text-rose-200";
    case "completed":
      return "border-blue-200/70 bg-blue-50/80 text-blue-800 dark:border-blue-300/20 dark:bg-blue-400/5 dark:text-blue-200";
    case "failed":
      return "border-red-200/70 bg-red-50/80 text-red-800 dark:border-red-300/20 dark:bg-red-400/5 dark:text-red-200";
    case "refunded":
      return "border-violet-200/70 bg-violet-50/80 text-violet-800 dark:border-violet-300/20 dark:bg-violet-400/5 dark:text-violet-200";
    case "insufficient":
      return "border-amber-200/70 bg-amber-50/80 text-amber-900 dark:border-amber-300/20 dark:bg-amber-400/5 dark:text-amber-200";
    case "info":
    default:
      return "border-neutral-200/70 bg-neutral-50/80 text-neutral-800 dark:border-white/12 dark:bg-white/5 dark:text-neutral-200";
  }
}

/**
 * ✅ 알림 1건 카드 컴포넌트
 */
function NotificationCard({
  item,
  onDismiss,
}: {
  item: NotificationItem;
  onDismiss: (id: string) => void;
}) {
  const t = useTranslations();

  const badgeLabel = t(`notification_status.${item.status}`);
  const categoryLabel = t(`notification_category.${item.category}`);

  const creditsText = (() => {
    const v = item.delta_credits ?? 0;
    if (v === 0) return null;
    return v > 0 ? `+${v}` : `${v}`;
  })();

  // ✅ DB에는 key + params만 들어있고, 여기서 i18n 변환
  const titleText = t(item.title_key, item.params ?? {});
  const messageText = t(item.message_key, item.params ?? {});

  return (
    <motion.div
      key={item.id}
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
              {/* 상태 배지 */}
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold",
                  getStatusBadgeClassName(item.status)
                )}
              >
                {badgeLabel}
              </span>

              <div className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                {titleText}
              </div>
            </div>

            <div className="mt-1 text-[12px] text-neutral-700 dark:text-neutral-300">
              {creditsText ? (
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                  {creditsText} {t("common.credits")}
                </span>
              ) : null}

              <span className="text-neutral-500 dark:text-neutral-400">
                {creditsText ? " · " : ""}
                {messageText}
              </span>
            </div>

            <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
              <CreatedAtText createdAt={item.created_at} />
              <span className="ml-2 text-neutral-400 dark:text-neutral-500">
                · {categoryLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(item.id)}
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
            aria-label={t("notifications.ui.dismiss_one")}
            title={t("notifications.ui.dismiss")}
          >
            <span className="text-[18px] leading-none">×</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CreatedAtText({ createdAt }: { createdAt: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? formatDateTime(createdAt) : ""}</>;
}

/**
 * ✅ GET /api/notifications?limit=5
 * 응답: { ok: true, items: NotificationItem[] }
 */
async function fetchNotifications(limit = 5): Promise<NotificationItem[]> {
  const res = await fetch(`/api/notifications?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers: { "content-type": "application/json" },
  });

  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  const items = (data?.items ?? data?.data ?? []) as NotificationItem[];
  return Array.isArray(items) ? items : [];
}

export default function GlobalNotificationsStack() {
  const t = useTranslations();

  const limit = 5;

  // ✅ React Query로 10초 폴링
  const { data, isFetched, isLoading } = useQuery({
    queryKey: ["notifications", { limit }],
    queryFn: () => fetchNotifications(limit),

    // ✅ 10초 폴링
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,

    // 폴링이라 staleTime은 의미가 덜하지만, 0으로 두면 확실함
    staleTime: 0,

    // 포커스/리커넥트 시에도 즉시 한번 더 당겨오고 싶으면 true 유지
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,

    retry: 1,
  });

  // ✅ UI 닫기(임시) 때문에 로컬 상태 유지
  const [items, setItems] = useState<NotificationItem[]>([]);

  // ✅ 서버 데이터 -> 로컬 동기화
  useEffect(() => {
    if (Array.isArray(data)) setItems(data);
  }, [data]);

  const count = items.length;

  const totalCredits = useMemo(
    () => items.reduce((acc, it) => acc + (it.delta_credits ?? 0), 0),
    [items]
  );

  const dismiss = (id: string) =>
    setItems((prev) => prev.filter((x) => x.id !== id));

  const dismissAll = () => setItems([]);

  // ✅ 초기 로딩 깜빡임 방지
  if (!isFetched && isLoading) return null;
  if (items.length === 0) return null;

  return (
    <div
      className="
        pointer-events-none
        fixed right-4 top-20 z-[80]
        w-[360px] max-w-[calc(100vw-2rem)]
      "
      aria-live="polite"
      aria-label={t("notifications.ui.aria_label")}
    >
      {/* 헤더 */}
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
          {t("notifications.ui.header_count", { count })}
          <span className="text-neutral-400 dark:text-neutral-400" aria-hidden>
            ·
          </span>
          <span className="text-emerald-700 dark:text-emerald-300">
            {totalCredits >= 0 ? `+${totalCredits}` : totalCredits}{" "}
            {t("common.credits")}
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
          {t("notifications.ui.dismiss_all")}
        </button>
      </div>

      {/* 카드 스택 */}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <NotificationCard key={it.id} item={it} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
