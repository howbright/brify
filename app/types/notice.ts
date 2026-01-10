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

// ✅ DB constraint (notifications_event_type_check)와 1:1로 맞춘 이벤트 타입
export type NotificationEventType =
  | "signup_bonus"
  | "mission_approved"
  | "mission_rejected"
  | "payment_completed"
  | "payment_failed"
  | "refund_completed"
  | "credit_insufficient"
  | "system_info";
