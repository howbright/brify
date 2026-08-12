"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { YoutubeReservationStatus } from "@/app/lib/youtubeReservations";

type Reservation = {
  id: string;
  user_id: string;
  requester_email: string | null;
  url: string;
  video_id: string | null;
  output_language: string | null;
  status: YoutubeReservationStatus;
  status_reason: string | null;
  required_credits: number | null;
  charged_credits: number | null;
  credit_snapshot: number;
  result_map_id: string | null;
  admin_notes: string | null;
  processed_at: string | null;
  user_email_sent_at: string | null;
  user_email_error: string | null;
  admin_failure_email_sent_at: string | null;
  admin_failure_email_error: string | null;
  manual_email_sent_at: string | null;
  manual_email_error: string | null;
  refunded_credits: number;
  refunded_at: string | null;
  refund_error: string | null;
  created_at: string;
  updated_at: string;
  requester: {
    email: string | null;
    creditsFree: number;
    creditsPaid: number;
    creditsTotal: number;
    role: string;
  } | null;
};

const STATUS_OPTIONS: YoutubeReservationStatus[] = [
  "requested",
  "checking",
  "ready",
  "needs_credits",
  "processing",
  "done",
  "failed",
  "cancelled",
  "unsupported",
  "retry_requested",
];

const STATUS_LABELS: Record<YoutubeReservationStatus, string> = {
  requested: "요청됨",
  checking: "확인 중",
  ready: "생성 가능",
  needs_credits: "크레딧 부족",
  processing: "처리 중",
  done: "완료",
  failed: "실패",
  cancelled: "취소",
  unsupported: "지원 불가",
  retry_requested: "다시 요청",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status: YoutubeReservationStatus) {
  if (status === "done") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "failed" || status === "unsupported") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  if (status === "retry_requested") return "bg-purple-50 text-purple-700 ring-purple-200";
  if (status === "needs_credits") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (status === "processing" || status === "checking") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export default function AdminYoutubeReservationsPage({
  locale,
}: {
  locale: string;
}) {
  const pathname = usePathname();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingMap, setGeneratingMap] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    status: "requested" as YoutubeReservationStatus,
    statusReason: "",
    requiredCredits: "",
    chargedCredits: "",
    resultMapId: "",
    adminNotes: "",
    title: "",
    manualContent: "",
    userMessage: "",
  });

  const selected = useMemo(
    () => reservations.find((item) => item.id === selectedId) ?? reservations[0] ?? null,
    [reservations, selectedId]
  );

  useEffect(() => {
    void loadReservations();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id);
    setForm((prev) => ({
      ...prev,
      status: selected.status,
      statusReason: selected.status_reason ?? "",
      requiredCredits: selected.required_credits?.toString() ?? "",
      chargedCredits: selected.charged_credits?.toString() ?? "",
      resultMapId: selected.result_map_id ?? "",
      adminNotes: selected.admin_notes ?? "",
      title: "",
      manualContent: "",
      userMessage: "",
    }));
    setGenerationMessage(null);
  }, [selected?.id]);

  async function loadReservations() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/youtube-reservations", {
        cache: "no-store",
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.error ?? "failed");
      setReservations(Array.isArray(json?.reservations) ? json.reservations : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveReservation() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/youtube-reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          status: form.status,
          statusReason: form.statusReason,
          requiredCredits: form.requiredCredits,
          chargedCredits: form.chargedCredits,
          resultMapId: form.resultMapId,
          adminNotes: form.adminNotes,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.error ?? "failed");
      await loadReservations();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "failed");
    } finally {
      setSaving(false);
    }
  }

  async function generateMapForReservation() {
    if (!selected) return;

    const title = form.title.trim();
    const content = form.manualContent.trim();

    if (!title) {
      setError("유튜브 영상 제목을 입력해 주세요.");
      return;
    }
    if (!content) {
      setError("구조맵으로 만들 원문/스크립트를 붙여넣어 주세요.");
      return;
    }

    setGeneratingMap(true);
    setGenerationMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/youtube-reservations/${encodeURIComponent(
          selected.id
        )}/generate-map`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        }
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json?.message ?? json?.error ?? "failed");
      }

      if (json?.outcome === "processing") {
        setGenerationMessage(
          `구조맵 생성이 시작되었습니다. 요청자에게 ${json.chargedCredits ?? json.requiredCredits ?? "-"}cr가 차감되었습니다.`
        );
      } else if (json?.outcome === "needs_credits") {
        setGenerationMessage(
          `요청자의 크레딧이 부족합니다. 필요 ${json.requiredCredits ?? "-"}cr, 현재 ${json.availableCredits ?? "-"}cr입니다.`
        );
      } else if (json?.outcome === "failed") {
        setGenerationMessage(`생성 요청이 실패 상태로 기록되었습니다. 사유: ${json.reason ?? "알 수 없음"}`);
      } else {
        setGenerationMessage("요청 처리가 완료되었습니다.");
      }

      await loadReservations();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "failed");
    } finally {
      setGeneratingMap(false);
    }
  }

  async function sendUserMessage() {
    if (!selected) return;

    const message = form.userMessage.trim();
    if (!message) {
      setError("사용자에게 보낼 안내 문구를 입력해 주세요.");
      return;
    }

    setSendingMessage(true);
    setGenerationMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/youtube-reservations/${encodeURIComponent(
          selected.id
        )}/send-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json?.message ?? json?.error ?? "failed");
      }

      setGenerationMessage("사용자에게 안내 메일을 보냈고, 예약 상태를 실패로 기록했습니다.");
      await loadReservations();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "failed");
    } finally {
      setSendingMessage(false);
    }
  }

  const latestCredits = selected?.requester?.creditsTotal ?? 0;
  const requesterEmail = selected?.requester_email ?? selected?.requester?.email ?? "";
  const generateButtonLabel =
    selected?.status === "failed" ||
    selected?.status === "needs_credits" ||
    selected?.status === "retry_requested" ||
    Boolean(selected?.result_map_id)
      ? "구조맵 다시 생성"
      : "요청자 명의로 구조맵 생성";

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href={`/${locale}/admin`} className="text-sm font-semibold text-blue-700">
            ← Admin home
          </Link>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">
            유튜브 예약 요청
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            사용자가 유튜브 URL을 예약하면 여기에서 URL, 요청자 이메일, 최신 크레딧을 확인하고
            수동 처리 상태를 관리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadReservations()}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50"
        >
          <Icon icon={loading ? "lucide:loader-circle" : "lucide:refresh-cw"} className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          새로고침
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-sm font-black text-slate-950">
              예약 목록 {reservations.length.toLocaleString()}건
            </div>
          </div>
          <div className="max-h-[720px] overflow-y-auto">
            {loading ? (
              <div className="p-5 text-sm font-bold text-slate-500">불러오는 중...</div>
            ) : reservations.length === 0 ? (
              <div className="p-5 text-sm font-bold text-slate-500">예약 요청이 없습니다.</div>
            ) : (
              reservations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={[
                    "block w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50",
                    selected?.id === item.id ? "bg-blue-50/70" : "bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-slate-950">
                        {item.requester_email ?? item.requester?.email ?? "unknown"}
                      </div>
                      <div className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {item.url}
                      </div>
                    </div>
                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1",
                        statusClass(item.status),
                      ].join(" ")}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-400">
                    {formatDate(item.created_at)} · snapshot {item.credit_snapshot}cr
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {selected ? (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm lg:grid-cols-2">
                <Info label="요청자 이메일" value={selected.requester_email ?? selected.requester?.email ?? "-"} />
                <Info label="요청자 user_id" value={selected.user_id} mono />
                <Info label="요청 언어" value={selected.output_language ?? "auto"} />
                <Info label="예약 당시 크레딧" value={`${selected.credit_snapshot.toLocaleString()}cr`} />
                <Info
                  label="현재 크레딧"
                  value={`total ${latestCredits.toLocaleString()}cr · free ${(selected.requester?.creditsFree ?? 0).toLocaleString()} · paid ${(selected.requester?.creditsPaid ?? 0).toLocaleString()}`}
                />
                <Info label="video_id" value={selected.video_id ?? "-"} mono />
                <Info label="생성 결과 map_id" value={selected.result_map_id ?? "-"} mono />
                <Info label="사용자 자동메일" value={selected.user_email_error ? `실패: ${selected.user_email_error}` : formatDate(selected.user_email_sent_at)} />
                <Info label="관리자 실패알림" value={selected.admin_failure_email_error ? `실패: ${selected.admin_failure_email_error}` : formatDate(selected.admin_failure_email_sent_at)} />
                <Info label="수동 안내메일" value={selected.manual_email_error ? `실패: ${selected.manual_email_error}` : formatDate(selected.manual_email_sent_at)} />
                <Info
                  label="환불"
                  value={
                    selected.refund_error
                      ? `실패: ${selected.refund_error}`
                      : selected.refunded_credits > 0
                        ? `${selected.refunded_credits}cr · ${formatDate(selected.refunded_at)}`
                        : "-"
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase text-slate-400">
                  URL
                </label>
                <input
                  readOnly
                  value={selected.url}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase text-slate-400">
                    상태
                  </span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        status: event.target.value as YoutubeReservationStatus,
                      }))
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase text-slate-400">
                    필요 크레딧
                  </span>
                  <input
                    value={form.requiredCredits}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, requiredCredits: event.target.value }))
                    }
                    inputMode="numeric"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase text-slate-400">
                    차감 크레딧
                  </span>
                  <input
                    value={form.chargedCredits}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, chargedCredits: event.target.value }))
                    }
                    inputMode="numeric"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase text-slate-400">
                  상태 사유
                </span>
                <input
                  value={form.statusReason}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, statusReason: event.target.value }))
                  }
                  placeholder="예: 스크립트 추출 실패, 크레딧 부족, 생성 완료"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase text-slate-400">
                  결과 map_id
                </span>
                <input
                  value={form.resultMapId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, resultMapId: event.target.value }))
                  }
                  placeholder="구조맵 생성 후 map id를 붙여넣기"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-mono"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase text-slate-400">
                  관리자 메모
                </span>
                <textarea
                  value={form.adminNotes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, adminNotes: event.target.value }))
                  }
                  rows={4}
                  placeholder="처리 과정, 영상 길이, 실패 사유 등을 남겨두세요."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase text-slate-400">
                  수동 추출 내용 입력란
                </span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="유튜브 영상 제목을 입력하세요"
                  className="mb-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900"
                />
                <textarea
                  value={form.manualContent}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, manualContent: event.target.value }))
                  }
                  rows={9}
                  placeholder="관리자가 직접 유튜브 내용을 긁어오거나 정리한 원문/스크립트를 임시로 붙여넣는 공간입니다. 저장은 상태 메모와 별개입니다."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6"
                />
              </label>

              {generationMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">
                  {generationMessage}
                </div>
              ) : null}

              <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="mb-2 block text-xs font-black uppercase text-slate-400">
                  사용자에게 직접 보낼 안내
                </span>
                <textarea
                  value={form.userMessage}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, userMessage: event.target.value }))
                  }
                  rows={4}
                  placeholder="예: 영상 자막을 안정적으로 확보하지 못해 이번 예약은 처리하지 못했습니다. 다른 공개 영상 URL로 다시 요청해 주세요."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void sendUserMessage()}
                    disabled={sendingMessage || !requesterEmail}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      requesterEmail
                        ? "입력한 문구를 사용자에게 이메일로 보내고 예약을 실패 상태로 기록합니다."
                        : "요청자 이메일이 없어 보낼 수 없습니다."
                    }
                  >
                    <Icon icon={sendingMessage ? "lucide:loader-circle" : "lucide:send"} className={sendingMessage ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    사용자에게 사유 메일 보내기
                  </button>
                </div>
              </label>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void generateMapForReservation()}
                  disabled={
                    generatingMap ||
                    selected.status === "processing" ||
                    selected.status === "done"
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                  title={
                    selected.status === "processing" || selected.status === "done"
                      ? "이미 처리 중이거나 완료된 예약입니다."
                      : "요청자 명의로 크레딧을 차감하고 구조맵 생성을 시작합니다."
                  }
                >
                  <Icon icon={generatingMap ? "lucide:loader-circle" : "lucide:sparkles"} className={generatingMap ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                  {generateButtonLabel}
                </button>
                {form.resultMapId ? (
                  <Link
                    href={`/${locale}/admin/${form.resultMapId}`}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700"
                  >
                    <Icon icon="lucide:external-link" className="h-4 w-4" />
                    결과 확인
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => void saveReservation()}
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-50"
                >
                  <Icon icon={saving ? "lucide:loader-circle" : "lucide:save"} className={saving ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                  저장
                </button>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                제목에는 유튜브 영상 제목을 넣고, 내용 입력란에는 관리자가 직접 확보한 원문/스크립트를
                붙여넣으세요. 생성이 시작되면 요청자 크레딧이 차감됩니다. 성공 메일은 사용자에게 자동
                발송되고, 실패 알림은 관리자에게 먼저 발송됩니다.
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-6 text-sm font-bold text-slate-500">
              선택된 예약이 없습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-black uppercase text-slate-400">{label}</div>
      <div
        className={[
          "mt-1 truncate text-sm font-bold text-slate-900",
          mono ? "font-mono" : "",
        ].join(" ")}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
