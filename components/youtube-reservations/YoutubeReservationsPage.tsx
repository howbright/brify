"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
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

function reasonLabelKey(status: YoutubeReservationStatus) {
  if (status === "failed" || status === "cancelled" || status === "unsupported") {
    return "failedReason";
  }
  if (status === "processing" || status === "checking" || status === "retry_requested") {
    return "progressNote";
  }
  return "statusNote";
}

export default function YoutubeReservationsPage({ locale }: { locale: string }) {
  const safeLocale = normalizeLocale(locale);
  const t = useTranslations("YoutubeReservationsPage");
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
        title: t("loadFailedTitle"),
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
        title: t("retryDoneTitle"),
        text: t("retryDone"),
        variant: "success",
      });
      await loadReservations();
    } catch (retryError) {
      showAlert({
        title: t("retryFailedTitle"),
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
            ← {t("back")}
          </Link>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-white/58">
            {t("description")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadReservations()}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50 dark:bg-cyan-400 dark:text-slate-950"
        >
          <Icon icon={loading ? "lucide:loader-circle" : "lucide:refresh-cw"} className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {t("refresh")}
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0d1422]">
        {loading ? (
          <div className="p-6 text-sm font-bold text-slate-500 dark:text-white/55">
            {t("loading")}
          </div>
        ) : reservations.length === 0 ? (
          <div className="p-6 text-sm font-bold text-slate-500 dark:text-white/55">
            {t("empty")}
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
                        {t("requestedAt")}: {formatDate(safeLocale, item.created_at)}
                      </span>
                      <span>
                        {t("updatedAt")}: {formatDate(safeLocale, item.updated_at)}
                      </span>
                      {item.required_credits !== null || item.charged_credits !== null ? (
                        <span>
                          {t("credits")}: {item.charged_credits ?? 0}/{item.required_credits ?? "-"}cr
                        </span>
                      ) : null}
                      <span>
                        {t("outputLanguage")}: {item.output_language ?? "auto"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-black ring-1",
                      statusClass(item.status),
                    ].join(" ")}
                  >
                    {t(`statuses.${item.status}`)}
                  </span>
                </div>

                {item.status_reason ? (
                  <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-600 dark:bg-white/[0.05] dark:text-white/60">
                    <span className="font-black text-slate-900 dark:text-white">
                      {t(reasonLabelKey(item.status))}:
                    </span>{" "}
                    {item.status_reason}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {item.result_map_id && item.status === "done" ? (
                    <Link
                      href={`/${safeLocale}/maps/${item.result_map_id}`}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white dark:bg-cyan-400 dark:text-slate-950"
                    >
                      <Icon icon="lucide:external-link" className="h-4 w-4" />
                      {t("openMap")}
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
                      {retryingId === item.id ? t("retrying") : t("retry")}
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
        confirmLabel={t("confirm")}
      />
    </main>
  );
}
