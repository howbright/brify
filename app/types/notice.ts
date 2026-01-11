// app/types/notice.ts

import { Database } from "./database.types";

export type NotificationCategory = "mission" | "billing" | "system";

export type NotificationStatus =
  | "approved"
  | "rejected"
  | "completed"
  | "failed"
  | "refunded"
  | "insufficient"
  | "info";

export type NotificationEventType =
  | "signup_bonus"
  | "mission_approved"
  | "mission_rejected"
  | "payment_completed"
  | "payment_failed"
  | "refund_completed"
  | "credit_insufficient"
  | "system_info";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];
export type NotificationUpdate =
  Database["public"]["Tables"]["notifications"]["Update"];

// ✅ next-intl t()에 바로 넣을 params 타입(복잡한 Json 말고 평평한 값만)
// app/types/notice.ts
export type NotificationParams = Record<string, string | number | Date>;


export type NotificationItem = {
  id: string;
  created_at: string;
  category: NotificationCategory;
  status: NotificationStatus;
  event_type: NotificationEventType;
  delta_credits: number;
  title_key: string;
  message_key: string;
  params: NotificationParams | null;
};
