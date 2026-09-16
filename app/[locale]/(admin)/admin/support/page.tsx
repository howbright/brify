import Link from "next/link";
import { adminSupabase } from "@/utils/supabase/admin";

type TicketRow = {
  id: number;
  user_id: string;
  category: string;
  title: string;
  message: string;
  email: string | null;
  needs_reply: boolean;
  meta: unknown;
  status: string;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  credits_free: number | null;
  credits_paid: number | null;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getRewardCredits(meta: unknown) {
  const value = asRecord(meta).rewardCredits;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getSourcePath(meta: unknown) {
  const value = asRecord(meta).sourcePath;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function statusClass(status: string) {
  if (status === "resolved" || status === "closed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (status === "in_progress") return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

export default async function AdminSupportTicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const { data: tickets, error: ticketError } = await adminSupabase
    .from("support_tickets")
    .select("id,user_id,category,title,message,email,needs_reply,meta,status,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(80);

  if (ticketError) {
    throw new Error(`support_tickets load failed: ${ticketError.message}`);
  }

  const rows = (tickets ?? []) as TicketRow[];
  const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)));
  const profilesById = new Map<string, ProfileRow>();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id,email,credits_free,credits_paid")
      .in("id", userIds);

    if (profileError) {
      throw new Error(`profiles load failed: ${profileError.message}`);
    }

    for (const profile of (profiles ?? []) as ProfileRow[]) {
      profilesById.set(profile.id, profile);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={`/${locale}/admin`} className="text-sm font-semibold text-blue-700">
            ← Admin home
          </Link>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">
            문의/버그 제보
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            우측 하단 10크레딧 제보 버튼으로 들어온 문의를 확인하고, 유효한 제보는 선물 지급 화면으로 이어갑니다.
          </p>
        </div>
        <Link
          href={`/${locale}/admin/credits/gift`}
          className="inline-flex h-10 items-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white"
        >
          무료 크레딧 지급
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[100px_130px_minmax(240px,1fr)_220px_170px] gap-0 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500">
          <div>상태</div>
          <div>유형/보상</div>
          <div>내용</div>
          <div>사용자</div>
          <div>작업</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
            아직 접수된 문의가 없습니다.
          </div>
        ) : (
          rows.map((ticket) => {
            const profile = profilesById.get(ticket.user_id);
            const email = ticket.email ?? profile?.email ?? "";
            const rewardCredits = getRewardCredits(ticket.meta);
            const sourcePath = getSourcePath(ticket.meta);
            const memo = [
              `피드백 보상: support_ticket #${ticket.id}`,
              ticket.title,
              sourcePath ? `source: ${sourcePath}` : null,
            ]
              .filter(Boolean)
              .join(" / ");
            const giftHref =
              `/${locale}/admin/credits/gift?` +
              new URLSearchParams({
                email,
                credits: String(rewardCredits ?? 10),
                memo,
                ticketId: String(ticket.id),
              }).toString();

            return (
              <article
                key={ticket.id}
                className="grid grid-cols-[100px_130px_minmax(240px,1fr)_220px_170px] gap-0 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-[11px] font-black ring-1 ${statusClass(ticket.status)}`}
                  >
                    {ticket.status}
                  </span>
                  <div className="mt-2 text-xs text-slate-400">#{ticket.id}</div>
                  <div className="mt-1 text-xs text-slate-400">{formatDate(ticket.created_at)}</div>
                </div>

                <div>
                  <div className="font-black text-slate-800">{ticket.category}</div>
                  {rewardCredits ? (
                    <div className="mt-2 inline-flex rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-700">
                      +{rewardCredits}cr 후보
                    </div>
                  ) : null}
                  <div className="mt-2 text-xs text-slate-500">
                    답변 {ticket.needs_reply ? "필요" : "불필요"}
                  </div>
                </div>

                <div className="min-w-0 pr-4">
                  <div className="font-black text-slate-950">{ticket.title}</div>
                  <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {ticket.message}
                  </p>
                  {sourcePath ? (
                    <div className="mt-2 break-all text-xs font-semibold text-blue-700">
                      source: {sourcePath}
                    </div>
                  ) : null}
                </div>

                <div className="min-w-0 pr-4">
                  <div className="truncate font-semibold text-slate-900">{email || "(email 없음)"}</div>
                  <div className="mt-1 break-all text-xs text-slate-400">{ticket.user_id}</div>
                  {profile ? (
                    <div className="mt-2 text-xs text-slate-500">
                      free {Number(profile.credits_free ?? 0)} · paid {Number(profile.credits_paid ?? 0)}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href={giftHref}
                    className="inline-flex h-9 items-center justify-center rounded-2xl bg-red-600 px-3 text-xs font-black text-white"
                  >
                    10cr 지급으로 이동
                  </Link>
                  {email ? (
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent(`[Brify] 문의 답변: ${ticket.title}`)}`}
                      className="inline-flex h-9 items-center justify-center rounded-2xl border border-slate-200 px-3 text-xs font-black text-slate-700"
                    >
                      답장 메일
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
