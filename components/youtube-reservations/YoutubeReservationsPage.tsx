"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { YoutubeReservationStatus } from "@/app/lib/youtubeReservations";
import Alert from "@/components/ui/Alert";

type Reservation = {
  id: string;
  url: string;
  video_id: string | null;
  output_language: string | null;
  status: YoutubeReservationStatus;
  status_reason: string | null;
  required_credits: number | null;
  charged_credits: number | null;
  result_map_id: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

const COPY = {
  ko: {
    title: "유튜브 예약 목록",
    description:
      "유튜브 URL로 예약한 구조맵 요청의 상태를 확인하고, 실패한 요청은 다시 요청할 수 있습니다.",
    empty: "아직 유튜브 예약 요청이 없습니다.",
    loading: "예약 목록을 불러오고 있어요.",
    retry: "다시 요청",
    retrying: "요청 중...",
    openMap: "구조맵 열기",
    back: "홈으로",
    failedReason: "실패 사유",
    requestedAt: "요청일",
    updatedAt: "업데이트",
    credits: "크레딧",
    outputLanguage: "요청 언어",
    retryDone: "다시 요청이 접수되었습니다.",
    retryDoneTitle: "다시 요청 완료",
    retryFailedTitle: "다시 요청 실패",
    loadFailedTitle: "예약 목록을 불러오지 못했습니다",
    confirm: "확인",
  },
  en: {
    title: "YouTube reservations",
    description:
      "Check the status of structure map requests reserved with YouTube URLs, and retry failed requests.",
    empty: "No YouTube reservations yet.",
    loading: "Loading reservations.",
    retry: "Request again",
    retrying: "Requesting...",
    openMap: "Open map",
    back: "Home",
    failedReason: "Reason",
    requestedAt: "Requested",
    updatedAt: "Updated",
    credits: "Credits",
    outputLanguage: "Language",
    retryDone: "Retry request received.",
    retryDoneTitle: "Retry requested",
    retryFailedTitle: "Retry failed",
    loadFailedTitle: "Could not load reservations",
    confirm: "OK",
  },
  fr: {
    title: "Réservations YouTube",
    description:
      "Consultez l’état des demandes réservées avec des URL YouTube et relancez les demandes échouées.",
    empty: "Aucune réservation YouTube pour le moment.",
    loading: "Chargement des réservations.",
    retry: "Redemander",
    retrying: "Demande...",
    openMap: "Ouvrir la carte",
    back: "Accueil",
    failedReason: "Raison",
    requestedAt: "Demandé le",
    updatedAt: "Mis à jour",
    credits: "Crédits",
    outputLanguage: "Langue",
    retryDone: "La nouvelle demande a été reçue.",
    retryDoneTitle: "Nouvelle demande reçue",
    retryFailedTitle: "Échec de la nouvelle demande",
    loadFailedTitle: "Impossible de charger les réservations",
    confirm: "OK",
  },
} as const;

const STATUS_LABELS: Record<"ko" | "en" | "fr", Record<YoutubeReservationStatus, string>> = {
  ko: {
    requested: "예약됨",
    checking: "확인 중",
    ready: "생성 가능",
    needs_credits: "크레딧 부족",
    processing: "처리 중",
    done: "완료",
    failed: "실패",
    cancelled: "취소",
    unsupported: "지원 불가",
    retry_requested: "다시 요청",
  },
  en: {
    requested: "Reserved",
    checking: "Checking",
    ready: "Ready",
    needs_credits: "Needs credits",
    processing: "Processing",
    done: "Done",
    failed: "Failed",
    cancelled: "Cancelled",
    unsupported: "Unsupported",
    retry_requested: "Retry requested",
  },
  fr: {
    requested: "Réservé",
    checking: "Vérification",
    ready: "Prêt",
    needs_credits: "Crédits requis",
    processing: "Traitement",
    done: "Terminé",
    failed: "Échec",
    cancelled: "Annulé",
    unsupported: "Non pris en charge",
    retry_requested: "Redemandé",
  },
};

function normalizeLocale(locale: string): "ko" | "en" | "fr" {
  return locale === "en" || locale === "fr" ? locale : "ko";
}

function formatDate(locale: string, value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status: YoutubeReservationStatus) {
  if (status === "done") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "failed" || status === "unsupported") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  if (status === "needs_credits") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (status === "retry_requested") return "bg-purple-50 text-purple-700 ring-purple-200";
  if (status === "processing" || status === "checking") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function canRetry(status: YoutubeReservationStatus) {
  return ["failed", "cancelled", "unsupported", "needs_credits"].includes(status);
}

export default function YoutubeReservationsPage({ locale }: { locale: string }) {
  const safeLocale = normalizeLocale(locale);
  const copy = COPY[safeLocale];
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title: string;
    text: string;
    variant: "info" | "success" | "warning" | "error";
  }>({
    open: false,
    title: "",
    text: "",
    variant: "info",
  });

  const showAlert = ({
    title,
    text,
    variant,
  }: {
    title: string;
    text: string;
    variant: "info" | "success" | "warning" | "error";
  }) => {
    setAlertState({ open: true, title, text, variant });
  };

  useEffect(() => {
    void loadReservations();
  }, []);

  async function loadReservations() {
    setLoading(true);
    try {
      const response = await fetch("/api/youtube-reservations", {
        cache: "no-store",
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.error ?? "failed");
      setReservations(Array.isArray(json?.reservations) ? json.reservations : []);
    } catch (loadError) {
      showAlert({
        title: copy.loadFailedTitle,
        text: loadError instanceof Error ? loadError.message : "failed",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function retryReservation(id: string) {
    setRetryingId(id);
    try {
      const response = await fetch(`/api/youtube-reservations/${id}/retry`, {
        method: "POST",
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.error ?? "failed");
      showAlert({
        title: copy.retryDoneTitle,
        text: copy.retryDone,
        variant: "success",
      });
      await loadReservations();
    } catch (retryError) {
      showAlert({
        title: copy.retryFailedTitle,
        text: retryError instanceof Error ? retryError.message : "failed",
        variant: "error",
      });
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/${safeLocale}`} className="text-sm font-black text-blue-700">
            ← {copy.back}
          </Link>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-white/58">
            {copy.description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadReservations()}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50 dark:bg-cyan-400 dark:text-slate-950"
        >
          <Icon icon={loading ? "lucide:loader-circle" : "lucide:refresh-cw"} className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0d1422]">
        {loading ? (
          <div className="p-6 text-sm font-bold text-slate-500 dark:text-white/55">
            {copy.loading}
          </div>
        ) : reservations.length === 0 ? (
          <div className="p-6 text-sm font-bold text-slate-500 dark:text-white/55">
            {copy.empty}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {reservations.map((item) => (
              <article key={item.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-all text-sm font-black text-slate-950 dark:text-white">
                      {item.url}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-400 dark:text-white/38">
                      <span>
                        {copy.requestedAt}: {formatDate(safeLocale, item.created_at)}
                      </span>
                      <span>
                        {copy.updatedAt}: {formatDate(safeLocale, item.updated_at)}
                      </span>
                      {item.required_credits !== null || item.charged_credits !== null ? (
                        <span>
                          {copy.credits}: {item.charged_credits ?? 0}/{item.required_credits ?? "-"}cr
                        </span>
                      ) : null}
                      <span>
                        {copy.outputLanguage}: {item.output_language ?? "auto"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-black ring-1",
                      statusClass(item.status),
                    ].join(" ")}
                  >
                    {STATUS_LABELS[safeLocale][item.status]}
                  </span>
                </div>

                {item.status_reason ? (
                  <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-600 dark:bg-white/[0.05] dark:text-white/60">
                    <span className="font-black text-slate-900 dark:text-white">
                      {copy.failedReason}:
                    </span>{" "}
                    {item.status_reason}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {item.result_map_id ? (
                    <Link
                      href={`/${safeLocale}/maps/${item.result_map_id}`}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white dark:bg-cyan-400 dark:text-slate-950"
                    >
                      <Icon icon="lucide:external-link" className="h-4 w-4" />
                      {copy.openMap}
                    </Link>
                  ) : null}
                  {canRetry(item.status) ? (
                    <button
                      type="button"
                      onClick={() => void retryReservation(item.id)}
                      disabled={retryingId === item.id}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 text-sm font-black text-purple-700 disabled:opacity-50"
                    >
                      <Icon
                        icon={retryingId === item.id ? "lucide:loader-circle" : "lucide:rotate-ccw"}
                        className={retryingId === item.id ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                      />
                      {retryingId === item.id ? copy.retrying : copy.retry}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <Alert
        open={alertState.open}
        onOpenChange={(open) => setAlertState((prev) => ({ ...prev, open }))}
        title={alertState.title}
        text={alertState.text}
        variant={alertState.variant}
        confirmLabel={copy.confirm}
      />
    </main>
  );
}
