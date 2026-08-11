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

function buildMailto({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
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
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    status: "requested" as YoutubeReservationStatus,
    statusReason: "",
    requiredCredits: "",
    chargedCredits: "",
    resultMapId: "",
    adminNotes: "",
    manualContent: "",
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
    }));
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

  const latestCredits = selected?.requester?.creditsTotal ?? 0;
  const requesterEmail = selected?.requester_email ?? selected?.requester?.email ?? "";
  const noCreditMailto = selected
    ? buildMailto({
        to: requesterEmail,
        subject: "[Brify] 유튜브 구조맵 예약 처리 안내",
        body: [
          "안녕하세요. Brify입니다.",
          "",
          "예약하신 유튜브 구조맵 요청을 확인했지만, 현재 보유 크레딧이 부족하여 구조맵 생성을 진행하지 못했습니다.",
          "",
          `예약 URL: ${selected.url}`,
          `요청 언어: ${selected.output_language ?? "auto"}`,
          `현재 크레딧: ${latestCredits}cr`,
          "",
          "크레딧을 충전하신 뒤 Brify의 유튜브 예약 목록에서 다시 요청해 주세요.",
          "",
          "감사합니다.",
          "Brify",
        ].join("\n"),
      })
    : "#";
  const customFailureMailto = selected
    ? buildMailto({
        to: requesterEmail,
        subject: "[Brify] 유튜브 구조맵 예약 처리 안내",
        body: [
          "안녕하세요. Brify입니다.",
          "",
          "예약하신 유튜브 구조맵 요청을 확인했지만, 아래 사유로 처리를 완료하지 못했습니다.",
          "",
          `예약 URL: ${selected.url}`,
          `요청 언어: ${selected.output_language ?? "auto"}`,
          `사유: ${form.statusReason || "(여기에 실패 사유를 입력해 주세요)"}`,
          "",
          "문제가 해결되었다면 Brify의 유튜브 예약 목록에서 다시 요청해 주세요.",
          "",
          "감사합니다.",
          "Brify",
        ].join("\n"),
      })
    : "#";

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

              <div className="flex flex-wrap justify-end gap-2">
                {requesterEmail ? (
                  <>
                    <a
                      href={noCreditMailto}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-800"
                    >
                      <Icon icon="lucide:mail-warning" className="h-4 w-4" />
                      크레딧 부족 메일 작성
                    </a>
                    <a
                      href={customFailureMailto}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-800"
                    >
                      <Icon icon="lucide:mail-x" className="h-4 w-4" />
                      실패 사유 메일 작성
                    </a>
                  </>
                ) : null}
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
                현재 버전은 예약 큐와 수동 처리 관리 화면입니다. 요청자 명의로 구조맵 생성, 크레딧 차감,
                이메일 발송까지 자동화하려면 NestJS 처리 API와 연결해야 합니다.
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
