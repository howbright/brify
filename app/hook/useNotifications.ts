// app/hooks/useNotifications.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { NotificationItem } from "@/app/types/notice";

type ApiResponse =
  | { ok: true; items: NotificationItem[] }
  | { ok: false; error: string };

async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch("/api/notifications", {
    method: "GET",
    cache: "no-store",
    headers: { "content-type": "application/json" },
  });

  if (!res.ok) {
    // 401/403이면 로그인 문제일 가능성도 있음
    throw new Error(`NOTIFICATIONS_${res.status}`);
  }

  const data = (await res.json().catch(() => null)) as ApiResponse | null;
  if (!data || data.ok !== true || !Array.isArray(data.items)) {
    throw new Error("NOTIFICATIONS_BAD_RESPONSE");
  }

  return data.items;
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,

    // ✅ (1) 포커스/리커넥트 시점에 최신으로
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,

    // ✅ “항상 최신이 중요”한 알림 UX이면 0이 직관적
    staleTime: 0,

    // ✅ 네트워크 잠깐 튕김 대비 (원하면 0으로 꺼도 됨)
    retry: 1,
  });
}
