// app/types/supports.ts

import { Database } from "./database.types";

export type SupportTicketCategory = "bug" | "idea" | "billing" | "other";
export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";

// Supabase generated types 재사용 (중복 정의 X)
export type SupportTicketRow =
  Database["public"]["Tables"]["support_tickets"]["Row"];

export type SupportTicketInsert =
  Database["public"]["Tables"]["support_tickets"]["Insert"];

export type SupportTicketUpdate =
  Database["public"]["Tables"]["support_tickets"]["Update"];

// ✅ 브라우저 -> Next.js (/api/support) 요청 바디 타입
// (여기엔 title/message가 들어가는 게 정상)
export type SupportTicketCreateBody = {
  category: SupportTicketCategory;
  title: string;
  message: string;
  email?: string | null;
  needs_reply?: boolean; // default true
  meta?: Record<string, any> | null;
};

// ✅ Next.js -> brify-backend 로 보낼 payload (ticket_id만)
export type SupportTicketEnqueueBody = {
  ticket_id: SupportTicketRow["id"]; // bigint identity면 number로 잡힐 수 있음 (db 타입에 따름)
  locale?: string; // optional
};
