"use client";

import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import NoteItem, { type NoteItemData } from "@/components/maps/NoteItem";
import TermsBlock from "@/components/maps/TermsBlock";

type LeftPanelTab = "info" | "notes" | "terms";
type NotesSubtab = "memo" | "node" | "highlight";
type TermItem = {
  term: string;
  meaning: string;
  updatedAt?: number;
  isNew?: boolean;
};
type NoteItem = NoteItemData;
type MindNode = {
  id?: string;
  topic?: string;
  note?: string | null;
  highlight?: { variant?: string } | null;
  children?: MindNode[];
};
type NodeNoteItem = {
  id: string;
  topic: string;
  note: string;
};
type HighlightItem = {
  id: string;
  topic: string;
};

export default function LeftPanel({
  open,
  onClose,
  onEdit,
  onEditTags,
  onDelete,
  deleteLabel,
  map,
  mapId,
  mindData,
  onSelectNodeNote,
  tab,
  onTabChange,
  termsTabId,
}: {
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onEditTags?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  map: MapDraft;
  mapId?: string;
  mindData?: unknown | null;
  onSelectNodeNote?: (nodeId: string) => void;
  tab?: LeftPanelTab;
  onTabChange?: (next: LeftPanelTab) => void;
  termsTabId?: string;
}) {
  const t = useTranslations("LeftPanel");
  const tRight = useTranslations("RightPanel");
  const locale = useLocale();
  const createdLabel = useMemo(
    () => safeDateLabel(map.createdAt),
    [map.createdAt]
  );
  const updatedLabel = useMemo(
    () => safeDateLabel(map.updatedAt),
    [map.updatedAt]
  );
  const sourceType = useMemo(() => map.sourceType ?? "text", [map.sourceType]);
  const displayTitle = useMemo(() => {
    const baseTitle = map.shortTitle?.trim() || map.title?.trim() || t("untitled");
    const channel = map.channelName?.trim();
    return channel ? `${baseTitle} [${channel}]` : baseTitle;
  }, [map.channelName, map.shortTitle, map.title, t]);
  const originalTitle = useMemo(
    () => map.title?.trim() || t("untitled"),
    [map.title, t]
  );

  const [internalTab, setInternalTab] = useState<LeftPanelTab>(tab ?? "info");
  const [notesSubtab, setNotesSubtab] = useState<NotesSubtab>("memo");
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
  const panelRef = useRef<HTMLElement | null>(null);

  const nodeNotes = useMemo(() => {
    const root =
      mindData &&
      typeof mindData === "object" &&
      "nodeData" in (mindData as Record<string, unknown>)
        ? ((mindData as { nodeData?: MindNode | null }).nodeData ?? null)
        : (mindData as MindNode | null);
    if (!root || typeof root !== "object") return [] as NodeNoteItem[];

    const collected: NodeNoteItem[] = [];
    const visit = (node: MindNode | null | undefined) => {
      if (!node || typeof node !== "object") return;
      const note = typeof node.note === "string" ? node.note.trim() : "";
      if (node.id && note) {
        collected.push({
          id: node.id,
          topic: node.topic?.trim() || t("untitled"),
          note,
        });
      }
      node.children?.forEach((child) => visit(child));
    };

    visit(root);
    return collected;
  }, [mindData, t]);
  const highlightItems = useMemo(() => {
    const root =
      mindData &&
      typeof mindData === "object" &&
      "nodeData" in (mindData as Record<string, unknown>)
        ? ((mindData as { nodeData?: MindNode | null }).nodeData ?? null)
        : (mindData as MindNode | null);
    if (!root || typeof root !== "object") return [] as HighlightItem[];

    const collected: HighlightItem[] = [];
    const visit = (node: MindNode | null | undefined) => {
      if (!node || typeof node !== "object") return;
      if (node.id && node.highlight?.variant) {
        collected.push({
          id: node.id,
          topic: node.topic?.trim() || t("untitled"),
        });
      }
      node.children?.forEach((child) => visit(child));
    };

    visit(root);
    return collected;
  }, [mindData, t]);
  const totalNotesCount = notes.length + nodeNotes.length + highlightItems.length;

  useEffect(() => {
    if (tab) setInternalTab(tab);
  }, [tab]);

  useEffect(() => {
    if (activeTab !== "notes") return;
    setNotesSubtab("memo");
  }, [activeTab]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, mapId]);

  useEffect(() => {
    if (!open || !mapId) return;
    if (termsLoading || terms.length > 0) return;
    fetchTerms(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mapId]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, onClose]);

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
      const res = await fetch(`/api/maps/${encodeURIComponent(mapId)}/terms`, {
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
      const res = await fetch(`/api/maps/${encodeURIComponent(mapId)}/terms/status`, {
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
      if (!termsRequestedInSession && !hasTermsRequest) {
        stopTermsPolling();
        setTermsStatus("idle");
        setTermsError(null);
        return;
      }

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
      const res = await fetch(`/api/maps/${encodeURIComponent(mapId)}/terms/auto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      const res = await fetch(`/api/maps/${encodeURIComponent(mapId)}/terms/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      const res = await fetch(
        `/api/maps/${encodeURIComponent(mapId)}/terms/${encodeURIComponent(term)}`,
        {
          method: "DELETE",
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
      ref={panelRef}
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
                  count={totalNotesCount}
                  onClick={() => setActiveTab("notes")}
                />
                <TabButton
                  active={activeTab === "terms"}
                  id={termsTabId}
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
              {displayTitle}
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
                      label={t("sourceType")}
                      value={sourceType}
                    />
                    {sourceType === "youtube" ? (
                      <RowItem
                        label={t("sourceTitle")}
                        value={originalTitle}
                        multiline
                      />
                    ) : null}
                    <RowItem
                      label={t("channel")}
                      value={map.channelName ?? t("none")}
                    />

                    <div className="mt-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500/80 dark:bg-blue-300/80" />
                        <div className="text-[12px] font-medium tracking-[0.01em] text-neutral-400 dark:text-white/45">
                          {t("sourceLink")}
                        </div>
                      </div>
                      {map.sourceUrl ? (
                        <a
                          href={map.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="
                            mt-0.5 block pl-[14px] text-[14px] font-medium
                            text-blue-700 hover:underline truncate
                            dark:text-sky-200
                          "
                          title={map.sourceUrl}
                        >
                          {map.sourceUrl}
                        </a>
                      ) : (
                        <div className="mt-0.5 pl-[14px] text-[14px] text-neutral-700 dark:text-white/85">
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
              subtab={notesSubtab}
              onSubtabChange={setNotesSubtab}
              noteText={noteText}
              setNoteText={setNoteText}
              onAdd={addNote}
              notes={notes}
              nodeNotes={nodeNotes}
              highlights={highlightItems}
              loading={notesLoading}
              submitting={noteSubmitting}
              error={notesError}
              onDelete={deleteNote}
              onUpdate={updateNote}
              onSelectNodeNote={onSelectNodeNote}
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
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500/80 dark:bg-blue-300/80" />
        <div className="text-[12px] font-medium tracking-[0.01em] text-neutral-400 dark:text-white/45">
          {label}
        </div>
      </div>
      <div
        className={`mt-0.5 pl-[14px] text-[14px] font-medium text-neutral-800 dark:text-white/80 ${
          multiline ? "whitespace-normal break-words leading-6" : "truncate"
        }`}
      >
        {value}
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
  id,
  active,
  label,
  count,
  badge,
  tone = "default",
  onClick,
}: {
  id?: string;
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
      id={id}
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
  subtab,
  onSubtabChange,
  noteText,
  setNoteText,
  onAdd,
  notes,
  nodeNotes,
  highlights,
  loading,
  submitting,
  error,
  onDelete,
  onUpdate,
  onSelectNodeNote,
  helperText,
  placeholder,
  addLabel,
  loadingLabel,
  emptyLabel,
}: {
  subtab: NotesSubtab;
  onSubtabChange: (next: NotesSubtab) => void;
  noteText: string;
  setNoteText: (v: string) => void;
  onAdd: () => void;
  notes: NoteItem[];
  nodeNotes: NodeNoteItem[];
  highlights: HighlightItem[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onSelectNodeNote?: (nodeId: string) => void;
  helperText: string;
  placeholder: string;
  addLabel: string;
  loadingLabel: string;
  emptyLabel: string;
}) {
  const locale = useLocale();
  const memoTitle = locale === "ko" ? "메모" : "Notes";
  const nodeNotesTitle = locale === "ko" ? "주석" : "Annotations";
  const highlightsTitle = locale === "ko" ? "하이라이트" : "Highlights";
  const nodeNotesEmpty =
    locale === "ko"
      ? "작성된 주석이 아직 없어요."
      : "No annotations yet.";
  const nodeNotesHelper =
    locale === "ko"
      ? "노드에 직접 달아둔 주석을 모아보고, 클릭해서 해당 노드로 바로 이동할 수 있어요."
      : "Browse annotations attached to nodes and jump to that node with one click.";
  const highlightsEmpty =
    locale === "ko"
      ? "하이라이트한 노드가 아직 없어요."
      : "No highlighted nodes yet.";
  const highlightsHelper =
    locale === "ko"
      ? "하이라이트한 노드를 모아보고, 클릭해서 해당 노드로 바로 이동할 수 있어요."
      : "Browse highlighted nodes and jump to them with one click.";

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex w-fit items-center rounded-full border border-slate-300 bg-neutral-100 p-1 dark:border-white/15 dark:bg-white/[0.06]">
        {[
          { id: "memo" as const, label: memoTitle, count: notes.length },
          { id: "node" as const, label: nodeNotesTitle, count: nodeNotes.length },
          {
            id: "highlight" as const,
            label: highlightsTitle,
            count: highlights.length,
          },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSubtabChange(item.id)}
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              subtab === item.id
                ? "bg-white text-neutral-900 shadow-sm dark:bg-white/14 dark:text-white"
                : "text-neutral-500 hover:text-neutral-800 dark:text-white/60 dark:hover:text-white/85"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span>{item.label}</span>
              <span
                className={`inline-flex min-w-[1.2rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${
                  subtab === item.id
                    ? "bg-neutral-900/8 text-neutral-700 dark:bg-white/14 dark:text-white"
                    : "bg-neutral-200 text-neutral-500 dark:bg-white/10 dark:text-white/65"
                }`}
              >
                {item.count}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="text-[16px] font-medium leading-7 text-neutral-600 dark:text-white/70">
        {subtab === "memo"
          ? helperText
          : subtab === "node"
          ? nodeNotesHelper
          : highlightsHelper}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[14px] leading-6 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {subtab === "memo" ? (
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
      ) : null}

      <div className="flex flex-col gap-2">
        {subtab === "memo" && loading ? (
          <div className="rounded-2xl border border-slate-400 bg-blue-50/50 p-4 text-[15px] leading-6 text-neutral-600 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/75">
            {loadingLabel}
          </div>
        ) : subtab === "memo" && notes.length === 0 ? (
          <div className="rounded-2xl border border-slate-400 bg-blue-50/50 p-4 text-[17px] font-medium leading-7 text-neutral-700 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80">
            {emptyLabel}
          </div>
        ) : subtab === "memo" ? (
          notes.map((n) => (
            <NoteItem
              key={n.id}
              note={n}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))
        ) : subtab === "node" && nodeNotes.length === 0 ? (
          <div className="rounded-2xl border border-slate-400 bg-amber-50/60 p-4 text-[16px] font-medium leading-7 text-neutral-700 dark:border-white/20 dark:bg-amber-500/10 dark:text-white/80">
            {nodeNotesEmpty}
          </div>
        ) : subtab === "node" ? (
          nodeNotes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectNodeNote?.(item.id)}
              className="rounded-2xl border border-slate-400 bg-white p-3 text-left transition-colors hover:bg-amber-50/60 dark:border-white/20 dark:bg-white/[0.08] dark:hover:bg-amber-500/10"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
                  <Icon icon="mdi:note-text-outline" className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[14px] font-semibold leading-6 text-neutral-900 dark:text-white/90">
                  {item.topic}
                </div>
                <Icon
                  icon="mdi:arrow-top-right"
                  className="h-4 w-4 shrink-0 text-neutral-400 dark:text-white/45"
                />
              </div>
              <div className="pl-8 text-[14px] leading-6 text-neutral-600 dark:text-white/70">
                {item.note}
              </div>
            </button>
          ))
        ) : highlights.length === 0 ? (
          <div className="rounded-2xl border border-slate-400 bg-yellow-50/60 p-4 text-[16px] font-medium leading-7 text-neutral-700 dark:border-white/20 dark:bg-yellow-500/10 dark:text-white/80">
            {highlightsEmpty}
          </div>
        ) : (
          highlights.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectNodeNote?.(item.id)}
              className="rounded-2xl border border-slate-400 bg-white p-3 text-left transition-colors hover:bg-yellow-50/60 dark:border-white/20 dark:bg-white/[0.08] dark:hover:bg-yellow-500/10"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-400/15 dark:text-yellow-200">
                  <Icon icon="mdi:marker" className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[14px] font-semibold leading-6 text-neutral-900 dark:text-white/90">
                  {item.topic}
                </div>
                <Icon
                  icon="mdi:arrow-top-right"
                  className="h-4 w-4 shrink-0 text-neutral-400 dark:text-white/45"
                />
              </div>
            </button>
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
