// app/types/notice.ts

export type NotificationCategory = "mission" | "billing" | "system";

export type NotificationStatus =
  | "approved" // 미션 승인/보상 지급 같은 확정 상태
  | "rejected" // 미션 반려
  | "completed" // 결제 완료/처리 완료
  | "failed" // 결제 실패/처리 실패
  | "refunded" // 환불 완료
  | "insufficient" // 크레딧 부족
  | "info"; // 시스템 안내/정보

export type NotificationItem = {
  id: string;
  created_at: string; // ISO
  category: NotificationCategory;
  status: NotificationStatus;
  delta_credits: number;
  title_key: string;
  message_key: string;
  params: Record<string, any>;
};

// ✅ 유형별 1개씩: 총 8개 더미
export const MOCK_NOTICES: NotificationItem[] = [
  // 1) 회원가입 보상 지급
  {
    id: "rw_signup_001",
    created_at: "2026-01-02T10:05:00+09:00",
    category: "system",
    status: "approved",
    delta_credits: 10,
    title_key: "notifications.signup_reward.title",
    message_key: "notifications.signup_reward.message",
    params: { credits: 10 },
  },

  // 2) 미션 완료 → 크레딧 지급
  {
    id: "rw_mission_approved_001",
    created_at: "2026-01-02T13:12:00+09:00",
    category: "mission",
    status: "approved",
    delta_credits: 5,
    title_key: "notifications.mission_approved.title",
    message_key: "notifications.mission_approved.message",
    params: { credits: 5, missionName: "첫 번째 미션" },
  },

  // 3) 미션 리젝트(반려)
  {
    id: "rw_mission_rejected_001",
    created_at: "2026-01-02T14:40:00+09:00",
    category: "mission",
    status: "rejected",
    delta_credits: 0,
    title_key: "notifications.mission_rejected.title",
    message_key: "notifications.mission_rejected.message",
    params: { reason: "검토 기준에 부합하지 않습니다.", missionName: "첫 번째 미션" },
  },

  // 4) 결제 완료 → 크레딧 지급
  {
    id: "rw_payment_success_001",
    created_at: "2026-01-02T16:05:00+09:00",
    category: "billing",
    status: "completed",
    delta_credits: 300,
    title_key: "notifications.payment_completed.title",
    message_key: "notifications.payment_completed.message",
    params: { credits: 300, amount: 25000, currency: "KRW", pack: "300 크레딧" },
  },

  // 5) 결제 실패
  {
    id: "rw_payment_failed_001",
    created_at: "2026-01-02T16:12:00+09:00",
    category: "billing",
    status: "failed",
    delta_credits: 0,
    title_key: "notifications.payment_failed.title",
    message_key: "notifications.payment_failed.message",
    params: { code: "PAYMENT_DECLINED" },
  },

  // 6) 환불 완료
  {
    id: "rw_refund_done_001",
    created_at: "2026-01-02T17:30:00+09:00",
    category: "billing",
    status: "refunded",
    delta_credits: -300,
    title_key: "notifications.refund_completed.title",
    message_key: "notifications.refund_completed.message",
    params: { credits: 300, amount: 25000, currency: "KRW" },
  },

  // 7) 크레딧 부족 → 사용 실패
  {
    id: "rw_credit_insufficient_001",
    created_at: "2026-01-02T18:05:00+09:00",
    category: "system",
    status: "insufficient",
    delta_credits: 0,
    title_key: "notifications.credit_insufficient.title",
    message_key: "notifications.credit_insufficient.message",
    params: { required: 2, balance: 1 },
  },

  // 8) 시스템 안내(정보성)
  {
    id: "rw_system_info_001",
    created_at: "2026-01-02T19:20:00+09:00",
    category: "system",
    status: "info",
    delta_credits: 0,
    title_key: "notifications.system_info.title",
    message_key: "notifications.system_info.message",
    params: { link: "/notices/maintenance-2026-01-03" },
  },
];
