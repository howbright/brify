"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import type { Database } from "@/app/types/database.types";
import { createClient } from "@/utils/supabase/client";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];
type MapNoteRow = Database["public"]["Tables"]["map_notes"]["Row"];
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
const NOTES_LIST_FIELDS =
  "id,created_at,updated_at,title,short_title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged,notes_count,terms_count";

function coerceMapStatus(status?: string | null) {
  if (status === "done" || status === "failed" || status === "processing") {
    return status;
  }
  return "processing" as const;
}

function withCacheBuster(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("t", Date.now().toString());
    return u.toString();
  } catch {
    return url;
  }
}

function rowToDraft(row: MapRow): MapDraft {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
    sourceUrl: row.source_url ?? undefined,
    sourceType: row.source_type ?? undefined,
    title: row.title ?? "",
    shortTitle: row.short_title ?? undefined,
    channelName: row.channel_name ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    notesCount: typeof row.notes_count === "number" ? row.notes_count : 0,
    termsCount: typeof row.terms_count === "number" ? row.terms_count : 0,
    description: row.description ?? undefined,
    summary: row.summary ?? undefined,
    thumbnailUrl: row.thumbnail_url ? withCacheBuster(row.thumbnail_url) : undefined,
    status: coerceMapStatus(row.map_status),
    creditsCharged:
      typeof row.credits_charged === "number" ? row.credits_charged : undefined,
  };
}

function extractNodeNotes(root: unknown, untitled: string) {
  const actualRoot =
    root &&
    typeof root === "object" &&
    "nodeData" in (root as Record<string, unknown>)
      ? ((root as { nodeData?: MindNode | null }).nodeData ?? null)
      : (root as MindNode | null);

  if (!actualRoot || typeof actualRoot !== "object") return [] as NodeNoteItem[];

  const collected: NodeNoteItem[] = [];
  const visit = (node: MindNode | null | undefined) => {
    if (!node || typeof node !== "object") return;
    const note = typeof node.note === "string" ? node.note.trim() : "";
    if (node.id && note) {
      collected.push({
        id: node.id,
        topic: node.topic?.trim() || untitled,
        note,
      });
    }
    node.children?.forEach((child) => visit(child));
  };

  visit(actualRoot);
  return collected;
}

function extractHighlights(root: unknown, untitled: string) {
  const actualRoot =
    root &&
    typeof root === "object" &&
    "nodeData" in (root as Record<string, unknown>)
      ? ((root as { nodeData?: MindNode | null }).nodeData ?? null)
      : (root as MindNode | null);

  if (!actualRoot || typeof actualRoot !== "object") return [] as HighlightItem[];

  const collected: HighlightItem[] = [];
  const visit = (node: MindNode | null | undefined) => {
    if (!node || typeof node !== "object") return;
    if (node.id && node.highlight?.variant) {
      collected.push({
        id: node.id,
        topic: node.topic?.trim() || untitled,
      });
    }
    node.children?.forEach((child) => visit(child));
  };

  visit(actualRoot);
  return collected;
}

function formatDate(ts?: string | null) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function formatTimestamp(ts?: number) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function getDisplayTitle(draft: MapDraft, untitled: string) {
  const baseTitle = draft.shortTitle?.trim() || draft.title?.trim() || untitled;
  const channel = draft.channelName?.trim();
  return channel ? `${baseTitle} [${channel}]` : baseTitle;
}

export default function MapNotesTab() {
  const tPage = useTranslations("MapsPage");
  const tCommon = useTranslations("MapsCommon");
  const untitled = tCommon("untitled");
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const [notesDrafts, setNotesDrafts] = useState<MapDraft[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"updatedDesc" | "titleAsc">("updatedDesc");
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memoNotes, setMemoNotes] = useState<MapNoteRow[]>([]);
  const [nodeNotes, setNodeNotes] = useState<NodeNoteItem[]>([]);
  const [highlightItems, setHighlightItems] = useState<HighlightItem[]>([]);

  const filteredDrafts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? notesDrafts.filter((draft) => {
          const haystack = [
            draft.shortTitle,
            draft.title,
            draft.channelName,
            ...(draft.tags ?? []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : notesDrafts;

    return [...base].sort((a, b) => {
      if (sort === "titleAsc") {
        return getDisplayTitle(a, untitled).localeCompare(
          getDisplayTitle(b, untitled),
          undefined,
          { sensitivity: "base" }
        );
      }
      return (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0);
    });
  }, [notesDrafts, query, sort, untitled]);

  const selectedDraft = useMemo(
    () => filteredDrafts.find((draft) => draft.id === selectedMapId) ?? null,
    [filteredDrafts, selectedMapId]
  );

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const run = async () => {
      setListLoading(true);
      try {
        const { data, error: listError } = await supabase
          .from("maps")
          .select(NOTES_LIST_FIELDS)
          .gt("notes_count", 0)
          .order("updated_at", { ascending: false, nullsFirst: false })
          .limit(200);

        if (listError) {
          throw new Error(tPage("notesTab.errors.load"));
        }

        if (cancelled) return;
        setNotesDrafts(Array.isArray(data) ? data.map((row) => rowToDraft(row as MapRow)) : []);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error && e.message
            ? e.message
            : tPage("notesTab.errors.load")
        );
      } finally {
        if (!cancelled) {
          setListLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [tPage]);

  useEffect(() => {
    if (filteredDrafts.length === 0) {
      setSelectedMapId(null);
      return;
    }
    if (
      !selectedMapId ||
      !filteredDrafts.some((draft) => draft.id === selectedMapId)
    ) {
      setSelectedMapId(filteredDrafts[0].id);
    }
  }, [filteredDrafts, selectedMapId]);

  useEffect(() => {
    if (!selectedMapId) {
      setMemoNotes([]);
      setNodeNotes([]);
      setHighlightItems([]);
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [mapResult, notesResult] = await Promise.all([
          supabase
            .from("maps")
            .select("id, mind_elixir")
            .eq("id", selectedMapId)
            .single(),
          fetch(`/api/notes?mapId=${encodeURIComponent(selectedMapId)}&limit=200`, {
            cache: "no-store",
          }),
        ]);

        if (mapResult.error) {
          throw new Error(tPage("notesTab.errors.load"));
        }

        const notesJson = await notesResult.json().catch(() => ({}));
        if (!notesResult.ok || !notesJson?.ok) {
          throw new Error(tPage("notesTab.errors.load"));
        }

        if (cancelled) return;

        setMemoNotes(Array.isArray(notesJson.items) ? notesJson.items : []);
        setNodeNotes(extractNodeNotes(mapResult.data?.mind_elixir ?? null, untitled));
        setHighlightItems(
          extractHighlights(mapResult.data?.mind_elixir ?? null, untitled)
        );
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error && e.message
            ? e.message
            : tPage("notesTab.errors.load")
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedMapId, tPage, untitled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) return;
    const el = stickyRef.current;
    if (!el) return;
    let lastLogAt = 0;
    const findScrollBlocker = (node: HTMLElement | null) => {
      let current: HTMLElement | null = node;
      while (current) {
        const style = window.getComputedStyle(current);
        const overflow =
          style.overflowY !== "visible" || style.overflowX !== "visible";
        if (overflow) return current;
        current = current.parentElement;
      }
      return null;
    };
    const logMetrics = (label: string) => {
      const now = Date.now();
      if (now - lastLogAt < 500) return;
      lastLogAt = now;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const blocker = findScrollBlocker(el.parentElement);
      const blockerStyle = blocker ? window.getComputedStyle(blocker) : null;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/b44aa14f-cb62-41f5-bd7a-02a25686b9d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'notes-sticky-1',hypothesisId:'H1',location:'MapNotesTab.tsx:sticky',message:label,data:{rect,position:style.position,top:style.top,overflowY:style.overflowY,blockerTag:blocker?.tagName ?? null,blockerOverflowY:blockerStyle?.overflowY ?? null,blockerOverflowX:blockerStyle?.overflowX ?? null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    };
    const onScroll = () => logMetrics("scroll");
    const onResize = () => logMetrics("resize");
    logMetrics("init");
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (listLoading) {
    return (
      <section className="grid gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="h-5 w-28 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
              </div>
            ))}
          </div>
        </aside>
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="h-6 w-40 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
          <div className="mt-5 flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
                <div className="mt-3 h-3 w-5/6 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
              </div>
            ))}
          </div>
        </section>
      </section>
    );
  }

  if (!error && notesDrafts.length === 0) {
    return (
      <section className="rounded-3xl border border-neutral-200 bg-white p-7 text-sm text-neutral-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
          {tPage("notesTab.title")}
        </h2>
        <p className="mt-2 leading-7">{tPage("notesTab.empty")}</p>
      </section>
    );
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
      <aside className="relative lg:self-start">
        <div
          ref={stickyRef}
          className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] lg:sticky lg:top-28"
        >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              {tPage("notesTab.title")}
            </h2>
            <p className="mt-1 text-[13px] text-neutral-500 dark:text-white/55">
              {tPage("notesTab.leftDescription")}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12px] font-semibold text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70">
            {notesDrafts.length}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Icon
              icon="mdi:magnify"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-white/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tPage("notesTab.searchPlaceholder")}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2.5 text-[14px] text-neutral-800 outline-none transition focus:border-neutral-300 focus:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white/85 dark:focus:border-white/20 dark:focus:bg-white/[0.07]"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "updatedDesc" | "titleAsc")}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[14px] font-medium text-neutral-700 outline-none transition focus:border-neutral-300 focus:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:focus:border-white/20 dark:focus:bg-white/[0.07]"
          >
            <option value="updatedDesc">{tPage("notesTab.sort.updatedDesc")}</option>
            <option value="titleAsc">{tPage("notesTab.sort.titleAsc")}</option>
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {filteredDrafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-4 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/50">
              {tPage("notesTab.noSearchResults")}
            </div>
          ) : (
          filteredDrafts.map((draft) => {
            const isSelected = draft.id === selectedMapId;
            return (
              <button
                key={draft.id}
                type="button"
                onClick={() => setSelectedMapId(draft.id)}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  isSelected
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/85 dark:hover:bg-white/[0.06]"
                }`}
              >
                <div className="line-clamp-2 text-[14px] font-semibold leading-6">
                  {getDisplayTitle(draft, untitled)}
                </div>
                <div
                  className={`mt-1 text-[12px] ${
                    isSelected
                      ? "text-white/70 dark:text-black/65"
                      : "text-neutral-500 dark:text-white/45"
                  }`}
                >
                  {formatTimestamp(draft.updatedAt ?? draft.createdAt)}
                </div>
                <div
                  className={`mt-2 flex flex-wrap items-center gap-1.5 text-[12px] ${
                    isSelected
                      ? "text-white/80 dark:text-black/70"
                      : "text-neutral-500 dark:text-white/55"
                  }`}
                >
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-1 dark:bg-white/10">
                    <Icon icon="mdi:note-text-outline" className="h-3.5 w-3.5" />
                    {tCommon("content.notes")} {draft.notesCount ?? 0}
                  </span>
                </div>
              </button>
            );
          }))}
        </div>
        </div>
      </aside>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="border-b border-neutral-200 pb-4 dark:border-white/10">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {selectedDraft
              ? getDisplayTitle(selectedDraft, untitled)
              : tPage("fallback.selectedMap")}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500 dark:text-white/55">
            {tPage("notesTab.rightDescription")}
          </p>
          {!loading && !error ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
              <SummaryPill
                icon="mdi:note-text-outline"
                label={tPage("notesTab.sections.memo")}
                count={memoNotes.length}
              />
              <SummaryPill
                icon="mdi:comment-text-outline"
                label={tPage("notesTab.sections.annotations")}
                count={nodeNotes.length}
              />
              <SummaryPill
                icon="mdi:marker"
                label={tPage("notesTab.sections.highlights")}
                count={highlightItems.length}
              />
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-5 flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
                <div className="mt-3 h-3 w-5/6 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
                <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-white/5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-5">
            <NotesSection
              icon="mdi:note-text-outline"
              title={tPage("notesTab.sections.memo")}
              count={memoNotes.length}
              emptyLabel={tPage("notesTab.emptySections.memo")}
            >
              {memoNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="mb-2 text-[12px] font-medium text-neutral-500 dark:text-white/45">
                    {tPage("notesTab.memoLabel")}
                  </div>
                  <div className="text-[14px] leading-7 text-neutral-800 dark:text-white/85">
                    {note.text}
                  </div>
                  <div className="mt-2 text-[12px] text-neutral-500 dark:text-white/45">
                    {formatDate(note.updated_at ?? note.created_at)}
                  </div>
                </div>
              ))}
            </NotesSection>

            <NotesSection
              icon="mdi:comment-text-outline"
              title={tPage("notesTab.sections.annotations")}
              count={nodeNotes.length}
              emptyLabel={tPage("notesTab.emptySections.annotations")}
            >
              {nodeNotes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="mb-1 text-[12px] font-medium text-neutral-500 dark:text-white/45">
                    {tPage("notesTab.nodeLabel")}
                  </div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">
                    {item.topic}
                  </div>
                  <div className="mt-2 text-[14px] leading-7 text-neutral-700 dark:text-white/75">
                    {item.note}
                  </div>
                </div>
              ))}
            </NotesSection>

            <NotesSection
              icon="mdi:marker"
              title={tPage("notesTab.sections.highlights")}
              count={highlightItems.length}
              emptyLabel={tPage("notesTab.emptySections.highlights")}
            >
              {highlightItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="mb-1 text-[12px] font-medium text-neutral-500 dark:text-white/45">
                    {tPage("notesTab.nodeLabel")}
                  </div>
                  <div className="text-[14px] font-semibold leading-6 text-neutral-800 dark:text-white/85">
                    {item.topic}
                  </div>
                </div>
              ))}
            </NotesSection>
          </div>
        )}
      </section>
    </section>
  );
}

function SummaryPill({
  icon,
  label,
  count,
}: {
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-neutral-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
      <Icon icon={icon} className="h-3.5 w-3.5" />
      <span className="font-medium">{label}</span>
      <span className="font-semibold">{count}</span>
    </span>
  );
}

function NotesSection({
  icon,
  title,
  count,
  emptyLabel,
  children,
}: {
  icon: string;
  title: string;
  count: number;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-white/80">
          <Icon icon={icon} className="h-4 w-4" />
        </span>
        <div className="text-[15px] font-semibold text-neutral-900 dark:text-white">
          {title}
        </div>
        <span className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[11px] font-bold text-neutral-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-4 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/50">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-col gap-3">{children}</div>
      )}
    </section>
  );
}
