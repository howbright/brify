"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import NoteItem, { type NoteItemData } from "@/components/maps/NoteItem";
import TermsBlock from "@/components/maps/TermsBlock";
import { createClient } from "@/utils/supabase/client";

type LeftPanelTab = "info" | "notes" | "terms";
type TermItem = {
  term: string;
  meaning: string;
  updatedAt?: number;
  isNew?: boolean;
};
type NoteItem = NoteItemData;

export default function LeftPanel({
  open,
  onClose,
  onEdit,
  onEditTags,
  onDelete,
  deleteLabel,
  map,
  mapId,
  tab,
  onTabChange,
}: {
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onEditTags?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  map: MapDraft;
  mapId?: string;
  tab?: LeftPanelTab;
  onTabChange?: (next: LeftPanelTab) => void;
}) {
  const t = useTranslations("LeftPanel");
  const tRight = useTranslations("RightPanel");
  const createdLabel = useMemo(
    () => safeDateLabel(map.createdAt),
    [map.createdAt]
  );
  const updatedLabel = useMemo(
    () => safeDateLabel(map.updatedAt),
    [map.updatedAt]
  );
  const sourceType = useMemo(() => map.sourceType ?? "text", [map.sourceType]);

  const [internalTab, setInternalTab] = useState<LeftPanelTab>(tab ?? "info");
  const activeTab = tab ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;
  const panelTitle =
    activeTab === "info" ? t("title") : tRight(`tabs.${activeTab}`);

  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termsStatus, setTermsStatus] = useState<
    "idle" | "queued" | "processing" | "done" | "failed"
  >("idle");
  const [termsRequestedInSession, setTermsRequestedInSession] = useState(false);
  const [hasTermsRequest, setHasTermsRequest] = useState(false);
  const termsPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const termsHighlightRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tab) setInternalTab(tab);
  }, [tab]);

  useEffect(() => {
    if (!open || !mapId) return;
    if (activeTab !== "notes") return;
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, mapId]);

  useEffect(() => {
    if (!open || !mapId) return;
    if (notesLoading || notes.length > 0) return;
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mapId]);

  useEffect(() => {
    if (!open || !mapId) return;
    if (activeTab !== "terms") return;
    if (termsLoading) return;
    if (terms.length > 0) return;
    fetchTerms(true);
    fetchTermsStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, mapId]);

  useEffect(() => {
    if (!open || !mapId) return;
    if (termsLoading || terms.length > 0) return;
    fetchTerms(true);
    fetchTermsStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mapId]);

  const fetchNotes = async () => {
    if (!mapId) return;
    setNotesLoading(true);
    setNotesError(null);
    try {
      const res = await fetch(
        `/api/notes?mapId=${encodeURIComponent(mapId)}&limit=200`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || tRight("errors.notes.fetch"));
      }
      const items: NoteItem[] = Array.isArray(json.items)
        ? json.items.map((row: any) => {
            const createdAt = new Date(row.created_at).getTime();
            return {
              id: String(row.id),
              text: String(row.text ?? ""),
              createdAt,
              createdAtLabel: new Date(createdAt).toLocaleString(),
            };
          })
        : [];
      setNotes(items);
    } catch (e: any) {
      setNotesError(e?.message ?? tRight("errors.notes.fetch"));
    } finally {
      setNotesLoading(false);
    }
  };

  const addNote = async () => {
    const trimmed = noteText.trim();
    if (!trimmed || !mapId || noteSubmitting) return;
    setNotesError(null);
    try {
      setNoteSubmitting(true);
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapId, text: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || tRight("errors.notes.add"));
      }
      const row = json.item ?? {};
      const createdAt = new Date(row.created_at).getTime();
      const item: NoteItem = {
        id: String(row.id),
        text: String(row.text ?? ""),
        createdAt,
        createdAtLabel: new Date(createdAt).toLocaleString(),
      };
      setNotes((prev) => [item, ...prev]);
      setNoteText("");
    } catch (e: any) {
      setNotesError(e?.message ?? tRight("errors.notes.add"));
    } finally {
      setNoteSubmitting(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!id) return;
    setNotesError(null);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || tRight("errors.notes.delete"));
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e: any) {
      setNotesError(e?.message ?? tRight("errors.notes.delete"));
    }
  };

  const updateNote = async (id: string, text: string) => {
    if (!id) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setNotesError(null);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || tRight("errors.notes.update"));
      }
      const row = json.item ?? {};
      const createdAt = new Date(row.created_at).getTime();
      const updated: NoteItem = {
        id: String(row.id),
        text: String(row.text ?? ""),
        createdAt,
        createdAtLabel: new Date(createdAt).toLocaleString(),
      };
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (e: any) {
      setNotesError(e?.message ?? tRight("errors.notes.update"));
    }
  };

  const getAccessToken = async () => {
    const supabase = createClient();
    const { data: sessionData, error: sessionErr } =
      await supabase.auth.getSession();

    if (sessionErr) {
      throw new Error(
        tRight("errors.auth.session", { message: sessionErr.message })
      );
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error(tRight("errors.auth.login"));
    }

    return accessToken;
  };

  const getApiBase = () => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base) {
      throw new Error(tRight("errors.env.missingApiBase"));
    }
    return base;
  };

  const stopTermsPolling = () => {
    if (termsPollRef.current) {
      clearInterval(termsPollRef.current);
      termsPollRef.current = null;
    }
  };

  const scheduleHighlightClear = () => {
    if (termsHighlightRef.current) {
      clearTimeout(termsHighlightRef.current);
    }
    termsHighlightRef.current = setTimeout(() => {
      setTerms((prev) => prev.map((item) => ({ ...item, isNew: false })));
    }, 4500);
  };

  const startTermsPolling = () => {
    if (termsPollRef.current) return;
    termsPollRef.current = setInterval(() => {
      fetchTermsStatus();
    }, 1500);
  };

  const termKey = (item: Pick<TermItem, "term" | "meaning">) =>
    `${item.term}::${item.meaning}`;

  const fetchTerms = async (silent = false, markNew = false) => {
    if (!mapId) return;
    if (termsLoading && !silent) return;
    if (!silent) setTermsLoading(true);

    try {
      const accessToken = await getAccessToken();
      const base = getApiBase();

      const res = await fetch(`${base}/maps/${mapId}/terms`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.message || json?.error || tRight("errors.terms.fetch");
        throw new Error(
          typeof msg === "string" ? msg : msg?.[0] || t("requestFailed")
        );
      }

      const rows = Array.isArray(json?.terms)
        ? json.terms
        : Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];

      const items: TermItem[] = rows.map((row: any) => {
        const rawTs =
          row.updated_at ?? row.updatedAt ?? row.created_at ?? row.createdAt;
        const updatedAt = rawTs ? new Date(rawTs).getTime() : 0;
        return {
          term: String(row.term ?? ""),
          meaning: String(row.meaning ?? ""),
          updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
          isNew: false,
        };
      });

      setTerms((prev) => {
        if (!markNew) {
          return items.map((item) => ({ ...item, isNew: false }));
        }
        const prevKeys = new Set(prev.map((item) => termKey(item)));
        const next = items.map((item) => ({
          ...item,
          isNew: !prevKeys.has(termKey(item)),
        }));
        scheduleHighlightClear();
        return next;
      });
    } catch (e) {
      console.error(e);
      setTermsError(tRight("errors.terms.fetch"));
    } finally {
      if (!silent) setTermsLoading(false);
    }
  };

  const fetchTermsStatus = async () => {
    if (!mapId) return;
    try {
      const accessToken = await getAccessToken();
      const base = getApiBase();

      const res = await fetch(`${base}/maps/${mapId}/terms/status`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        const msg =
          json?.message || json?.error || tRight("errors.terms.statusFetch");
        throw new Error(
          typeof msg === "string" ? msg : msg?.[0] || t("requestFailed")
        );
      }

      const status = String(json?.status ?? "").toLowerCase();
      const explicitHasRequest =
        typeof json?.hasRequest === "boolean"
          ? json.hasRequest
          : typeof json?.has_request === "boolean"
          ? json.has_request
          : null;
      const inferredHasRequest =
        Boolean(json?.requestId || json?.request_id || json?.id) ||
        (termsRequestedInSession && Boolean(status)) ||
        (status !== "" && status !== "idle");
      const hasRequest =
        explicitHasRequest === null ? inferredHasRequest : explicitHasRequest;
      setHasTermsRequest(hasRequest);

      if (!termsRequestedInSession && !hasRequest) {
        stopTermsPolling();
        setTermsStatus("idle");
        setTermsError(null);
        return;
      }

      if (!hasRequest) {
        stopTermsPolling();
        setTermsStatus("idle");
        setTermsError(null);
        return;
      }

      if (status === "idle" || status === "queued" || status === "processing") {
        setTermsStatus(status);
        startTermsPolling();
        setTermsError(null);
        return;
      }

      if (status === "done") {
        setTermsStatus("done");
        stopTermsPolling();
        await fetchTerms(true, true);
        setTermsError(null);
        return;
      }

      if (status === "failed") {
        setTermsStatus("failed");
        stopTermsPolling();
        if (termsRequestedInSession) {
          setTermsError(tRight("errors.terms.generateFail"));
        } else {
          setTermsError(null);
        }
      }
    } catch (e) {
      console.error(e);
      setHasTermsRequest(false);
      setTermsStatus("failed");
      stopTermsPolling();
      if (termsRequestedInSession) {
        setTermsError(tRight("errors.terms.statusFail"));
      } else {
        setTermsError(null);
      }
    }
  };

  const requestAutoTerms = async () => {
    if (!mapId || termsLoading) return;
    setTermsError(null);
    setTermsStatus("queued");
    setTermsRequestedInSession(true);
    setHasTermsRequest(true);
    startTermsPolling();
    setTermsLoading(true);
    try {
      const accessToken = await getAccessToken();
      const base = getApiBase();

      const res = await fetch(`${base}/maps/${mapId}/terms/auto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.message || json?.error || tRight("errors.terms.autoStartFail");
        throw new Error(
          typeof msg === "string" ? msg : msg?.[0] || t("requestFailed")
        );
      }

      await fetchTermsStatus();
    } catch (e) {
      console.error(e);
      setTermsStatus("failed");
      stopTermsPolling();
      setTermsError(tRight("errors.terms.requestFail"));
    } finally {
      setTermsLoading(false);
    }
  };

  const requestCustomTerms = async (termsCsv: string) => {
    if (!mapId || termsLoading) return;
    setTermsError(null);
    setTermsRequestedInSession(true);
    setTermsStatus("queued");
    setHasTermsRequest(true);
    startTermsPolling();
    setTermsLoading(true);
    try {
      const accessToken = await getAccessToken();
      const base = getApiBase();

      const res = await fetch(`${base}/maps/${mapId}/terms/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ termsCsv }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.message || json?.error || tRight("errors.terms.customStartFail");
        throw new Error(
          typeof msg === "string" ? msg : msg?.[0] || t("requestFailed")
        );
      }

      await fetchTermsStatus();
    } catch (e) {
      console.error(e);
      setTermsError(tRight("errors.terms.requestFail"));
    } finally {
      setTermsLoading(false);
    }
  };

  const deleteTerm = async (term: string) => {
    if (!mapId || !term || termsLoading) return;
    setTermsLoading(true);
    try {
      const accessToken = await getAccessToken();
      const base = getApiBase();

      const res = await fetch(
        `${base}/maps/${mapId}/terms/${encodeURIComponent(term)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.message || json?.error || tRight("errors.terms.deleteFail");
        throw new Error(
          typeof msg === "string" ? msg : msg?.[0] || t("requestFailed")
        );
      }

      setTerms((prev) => prev.filter((item) => item.term !== term));
    } catch (e) {
      console.error(e);
      setTermsError(tRight("errors.terms.deleteFail"));
    } finally {
      setTermsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      stopTermsPolling();
      if (termsHighlightRef.current) {
        clearTimeout(termsHighlightRef.current);
        termsHighlightRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      stopTermsPolling();
      if (termsHighlightRef.current) {
        clearTimeout(termsHighlightRef.current);
        termsHighlightRef.current = null;
      }
    };
  }, []);

  return (
    <aside
      className={`
        absolute top-0 left-0 z-[30]
        h-full w-[94vw] max-w-[550px]
        transition-transform duration-200 ease-out
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
      aria-hidden={!open}
    >
      <div
        className="
          relative h-full flex flex-col
          border-r border-slate-400 bg-white
          dark:border-white/20 dark:bg-[#0b1220]
          shadow-[18px_0_45px_-30px_rgba(15,23,42,0.55)]
          dark:shadow-[18px_0_70px_-45px_rgba(0,0,0,0.9)]
        "
      >
        {/* highlight */}
        <div
          className="
            pointer-events-none absolute inset-0
            bg-[radial-gradient(900px_240px_at_10%_0%,rgba(59,130,246,0.10),transparent_60%)]
            dark:bg-[radial-gradient(900px_240px_at_10%_0%,rgba(56,189,248,0.12),transparent_60%)]
          "
        />
        <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />

        {/* header */}
        <div className="relative px-5 pt-3 border-b border-slate-400 dark:border-white/20">
          <div className="flex items-center justify-between gap-3">
            {mapId ? (
              <div className="flex items-center gap-5">
                <TabButton
                  active={activeTab === "info"}
                  label={t("infoTab")}
                  onClick={() => setActiveTab("info")}
                />
                <TabButton
                  active={activeTab === "notes"}
                  label={tRight("tabs.notes")}
                  count={notes.length}
                  onClick={() => setActiveTab("notes")}
                />
                <TabButton
                  active={activeTab === "terms"}
                  label={tRight("tabs.terms")}
                  count={terms.length}
                  badge="AI"
                  tone="mystic"
                  onClick={() => {
                    setActiveTab("terms");
                    if (!termsLoading && terms.length === 0) fetchTerms();
                  }}
                />
              </div>
            ) : (
              <div className="text-sm font-semibold text-neutral-900 dark:text-white/90 truncate">
                {panelTitle}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="
                ml-auto -mr-5 inline-flex items-center justify-center
                h-8 w-10
                rounded-l-full rounded-r-md
                bg-blue-600 text-white
                shadow-sm hover:bg-blue-700
                dark:bg-blue-500/70 dark:text-white dark:hover:bg-blue-500
              "
              aria-label={t("close")}
              title={t("close")}
            >
              <Icon icon="mdi:chevron-left" className="h-5 w-5" />
            </button>
          </div>

          {activeTab === "info" && (
            <div className="mt-3 text-[17px] font-bold text-neutral-900 dark:text-white/90 whitespace-normal break-words leading-6">
              {map.title ?? t("untitled")}
            </div>
          )}
        </div>

        {/* body */}
        <div className="relative flex-1 min-h-0 overflow-y-auto px-5 py-5">
          {activeTab === "info" ? (
            <>
              <div className="mb-4 text-[14px] leading-6 text-neutral-500 dark:text-white/55">
                <div>
                  {t("created")} {createdLabel} · {t("updated")} {updatedLabel}
                </div>
                <div className="mt-0.5">
                  {t("credits")}:{" "}
                  <span className="text-neutral-600 dark:text-white/70 font-semibold">
                    {typeof map.creditsCharged === "number"
                      ? map.creditsCharged
                      : "-"}
                  </span>
                </div>
              </div>
              {onEdit && (
                <div className="mb-3 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="
                      shrink-0
                      inline-flex items-center gap-1.5
                      rounded-2xl border border-slate-400 bg-blue-50 px-3 py-1.5
                      text-sm font-semibold text-blue-700 hover:bg-blue-100
                      dark:border-white/20 dark:bg-blue-500/10
                      dark:text-blue-50/90 dark:hover:bg-blue-500/20
                    "
                  >
                    <Icon icon="mdi:pencil" className="h-4 w-4" />
                    {t("edit")}
                  </button>
                </div>
              )}
              {map.summary ? (
                <section className="mb-4">
                  <div className="mb-2.5 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-blue-200 dark:bg-blue-500/40" />
                    <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white/85">
                      {t("summarySection")}
                    </h3>
                  </div>
                  <div
                    className="
                      rounded-3xl border border-slate-400 bg-blue-50/60 p-3.5
                      text-[15px] leading-7 text-neutral-700
                      shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)]
                      dark:border-white/20 dark:bg-blue-500/10 dark:text-white/80
                      dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.55)]
                    "
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {map.summary}
                    </p>
                  </div>
                </section>
              ) : null}

              {/* 출처 */}
              <Section title={t("sourceSection")}>
                <div className="flex gap-3">
                  <div
                    className="
                      relative h-16 w-28 rounded-2xl overflow-hidden
                      border border-slate-400 bg-neutral-50 flex-shrink-0
                      dark:border-white/20 dark:bg-white/[0.06]
                    "
                  >
                    {map.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={map.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[11px] text-neutral-400 dark:text-white/45">
                        {t("thumbnailPlaceholder")}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <RowItem
                      icon="mdi:youtube"
                      label={t("sourceType")}
                      value={sourceType}
                    />
                    <RowItem
                      icon="mdi:account-circle-outline"
                      label={t("channel")}
                      value={map.channelName ?? t("none")}
                    />

                    <div className="mt-1">
                      <div className="text-[14px] font-medium text-neutral-500 dark:text-white/60">
                        {t("sourceLink")}
                      </div>
                      {map.sourceUrl ? (
                        <a
                          href={map.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="
                            mt-0.5 block text-[14px] font-semibold
                            text-blue-700 hover:underline truncate
                            dark:text-sky-200
                          "
                          title={map.sourceUrl}
                        >
                          {map.sourceUrl}
                        </a>
                      ) : (
                        <div className="mt-0.5 text-[14px] text-neutral-700 dark:text-white/85">
                          {t("none")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Section>

              {/* ✅ 태그: description 보다 위로 올림 */}
              <section className="mb-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-neutral-200 dark:bg-white/15" />
                    <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white/85">
                      {t("tagsSection")}
                    </h3>
                    {onEditTags ? (
                      <button
                        type="button"
                        onClick={onEditTags}
                        className="
                          inline-flex h-7 w-7 items-center justify-center
                          rounded-lg border border-slate-400 bg-white
                          text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900
                          dark:border-white/20 dark:bg-white/[0.08]
                          dark:text-white/75 dark:hover:bg-white/[0.12] dark:hover:text-white
                        "
                        aria-label={t("edit")}
                        title={t("edit")}
                      >
                        <Icon icon="mdi:pencil" className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div
                  className="
                    rounded-3xl border border-slate-400 bg-white p-3
                    shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)]
                    dark:border-white/20 dark:bg-white/[0.04]
                    dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.55)]
                  "
                >
                  {map.tags?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {map.tags.slice(0, 24).map((t) => (
                        <span
                          key={t}
                          className="
                            rounded-full border border-slate-400 bg-neutral-50
                            px-2.5 py-1 text-[13px] font-medium text-neutral-700
                            dark:border-white/20 dark:bg-white/[0.06] dark:text-white/75
                          "
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <EmptyText>{t("noTags")}</EmptyText>
                  )}
                </div>
              </section>

              {/* ✅ description: 접기/펼치기 제거 → 항상 노출 */}
              <Section title={t("descriptionSection")}>
                <div className="text-[15px] leading-7 text-neutral-700 dark:text-white/80 whitespace-pre-wrap break-words">
                  {map.description ?? t("noDescription")}
                </div>
              </Section>

              {onDelete && (
                <div className="mt-6 pt-4 border-t border-slate-400 dark:border-white/20">
                  <button
                    type="button"
                    onClick={onDelete}
                    className="
                      inline-flex items-center gap-1.5
                      rounded-2xl border border-rose-200 bg-rose-50 px-3 py-1.5
                      text-sm font-semibold text-rose-700 hover:bg-rose-100
                      dark:border-rose-300/30 dark:bg-rose-500/10
                      dark:text-rose-100/90 dark:hover:bg-rose-500/20
                    "
                  >
                    <Icon icon="mdi:trash-outline" className="h-4 w-4" />
                    {deleteLabel ?? t("delete")}
                  </button>
                </div>
              )}
            </>
          ) : activeTab === "notes" ? (
            <NotesBlock
              noteText={noteText}
              setNoteText={setNoteText}
              onAdd={addNote}
              notes={notes}
              loading={notesLoading}
              submitting={noteSubmitting}
              error={notesError}
              onDelete={deleteNote}
              onUpdate={updateNote}
              helperText={tRight("notes.helper")}
              placeholder={tRight("notes.placeholder")}
              addLabel={tRight("notes.add")}
              loadingLabel={tRight("notes.loading")}
              emptyLabel={tRight("notes.empty")}
            />
          ) : (
            <>
              <div className="mb-4 rounded-2xl border border-slate-400 bg-sky-50/70 px-4 py-3 text-[14px] leading-6 text-slate-700 shadow-[0_16px_30px_-24px_rgba(14,116,144,0.45)] dark:border-white/20 dark:bg-sky-500/10 dark:text-white/75">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:sparkles" className="h-5 w-5 text-sky-500 dark:text-sky-300" />
                  <span className="font-semibold">
                    {t("termsIntro")}
                  </span>
                </div>
              </div>

              <TermsBlock
                terms={terms}
                loading={
                  termsLoading ||
                  (termsRequestedInSession &&
                    (termsStatus === "idle" ||
                      termsStatus === "queued" ||
                      termsStatus === "processing"))
                }
                error={termsError}
                usedCount={0}
                onAutoExtract={requestAutoTerms}
                onExplainCustom={requestCustomTerms}
                onDeleteTerm={deleteTerm}
              />
            </>
          )}
        </div>

      </div>
    </aside>
  );
}

/* ---------------- UI bits ---------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-neutral-200 dark:bg-white/15" />
        <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white/85">
          {title}
        </h3>
      </div>

      <div
        className="
          rounded-3xl border border-slate-400 bg-white p-3
          shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)]
          dark:border-white/20 dark:bg-white/[0.04]
          dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.55)]
        "
      >
        {children}
      </div>
    </section>
  );
}

function RowItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon
        icon={icon}
        className="h-5 w-5 text-neutral-500 dark:text-white/55"
      />
      <div className="min-w-0">
        <div className="text-[13px] text-neutral-500 dark:text-white/60">
          {label}
        </div>
        <div className="text-[15px] font-semibold text-neutral-800 dark:text-white/85 truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[14px] leading-6 text-neutral-500 dark:text-white/60">
      {children}
    </div>
  );
}

function TabButton({
  active,
  label,
  count,
  badge,
  tone = "default",
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  badge?: string;
  tone?: "default" | "mystic";
  onClick: () => void;
}) {
  const isMystic = tone === "mystic";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative inline-flex items-center gap-2
        border-b-2 px-1 pb-2 text-[16px] font-bold transition-colors
        ${
          active
            ? isMystic
              ? "border-sky-400 text-sky-700 dark:border-sky-300 dark:text-sky-200"
              : "border-blue-500 text-blue-700 dark:text-blue-200"
            : isMystic
            ? "border-transparent text-slate-600 hover:text-sky-700 dark:text-sky-200/70 dark:hover:text-sky-200"
            : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-white/60 dark:hover:text-white/85"
        }
      `}
    >
      <span
        className={
          isMystic && !active
            ? "absolute -inset-x-1 -inset-y-1 rounded-xl bg-[radial-gradient(70%_70%_at_50%_50%,rgba(56,189,248,0.22),transparent_70%)] opacity-60"
            : isMystic
            ? "absolute -inset-x-1 -inset-y-1 rounded-xl bg-[radial-gradient(80%_80%_at_50%_50%,rgba(56,189,248,0.28),transparent_70%)] opacity-70"
            : "absolute inset-0 pointer-events-none"
        }
        aria-hidden="true"
      />
      <span className="relative">{label}</span>
      {typeof count === "number" && count > 0 ? (
        <span
          className={`
            relative inline-flex min-w-6 items-center justify-center
            rounded-full px-1.5 py-0.5 text-[11px] font-semibold tracking-tight
            ${
              active
                ? "bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200"
                : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
            }
          `}
        >
          {count}
        </span>
      ) : null}
      {badge ? (
        <span
          className="
            relative inline-flex items-center gap-1
            rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-tight
            text-white
            bg-[linear-gradient(135deg,#7c3aed,#22c55e,#3b82f6)]
            shadow-[0_8px_18px_-10px_rgba(124,58,237,0.65)]
          "
        >
          <Icon icon="mdi:sparkles" className="h-3 w-3" />
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function NotesBlock({
  noteText,
  setNoteText,
  onAdd,
  notes,
  loading,
  submitting,
  error,
  onDelete,
  onUpdate,
  helperText,
  placeholder,
  addLabel,
  loadingLabel,
  emptyLabel,
}: {
  noteText: string;
  setNoteText: (v: string) => void;
  onAdd: () => void;
  notes: NoteItem[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  helperText: string;
  placeholder: string;
  addLabel: string;
  loadingLabel: string;
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[16px] font-medium leading-7 text-neutral-600 dark:text-white/70">
        {helperText}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[14px] leading-6 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !submitting) {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="
            flex-1 rounded-2xl border border-slate-400 bg-blue-50/40 px-4 py-3 text-[15px]
            outline-none focus:ring-2 focus:ring-blue-200
            dark:border-white/20 dark:bg-white/[0.06] dark:text-white
            dark:focus:ring-blue-500/20
          "
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={submitting}
          className="
            rounded-2xl border border-blue-700 bg-blue-700 px-4 py-3
            text-[15px] font-semibold text-white hover:bg-blue-800
            disabled:cursor-not-allowed disabled:opacity-60
            dark:border-blue-400 dark:bg-blue-500
            dark:text-white dark:hover:bg-blue-400
          "
        >
          {addLabel}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="rounded-2xl border border-slate-400 bg-blue-50/50 p-4 text-[15px] leading-6 text-neutral-600 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/75">
            {loadingLabel}
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-2xl border border-slate-400 bg-blue-50/50 p-4 text-[17px] font-medium leading-7 text-neutral-700 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80">
            {emptyLabel}
          </div>
        ) : (
          notes.map((n) => (
            <NoteItem
              key={n.id}
              note={n}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function safeDateLabel(ts?: number) {
  if (!ts) return "-";
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  } catch {
    return "-";
  }
}
