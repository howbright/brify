"use client";

import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import type { Database } from "@/app/types/database.types";
import { createClient } from "@/utils/supabase/client";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];
type TermItem = {
  term: string;
  meaning: string;
  updatedAt?: number;
};

const TERMS_LIST_FIELDS =
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

function getDisplayTitle(draft: MapDraft, untitled: string) {
  const baseTitle = draft.shortTitle?.trim() || draft.title?.trim() || untitled;
  const channel = draft.channelName?.trim();
  return channel ? `${baseTitle} [${channel}]` : baseTitle;
}

function formatTimestamp(ts?: number) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function MapTermsTab() {
  const router = useRouter();
  const locale = useLocale();
  const tPage = useTranslations("MapsPage");
  const tCommon = useTranslations("MapsCommon");
  const untitled = tCommon("untitled");

  const [termsDrafts, setTermsDrafts] = useState<MapDraft[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [openingDetailId, setOpeningDetailId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"updatedDesc" | "titleAsc">("updatedDesc");
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terms, setTerms] = useState<TermItem[]>([]);

  const filteredDrafts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? termsDrafts.filter((draft) => {
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
      : termsDrafts;

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
  }, [query, sort, termsDrafts, untitled]);

  const selectedDraft = useMemo(
    () => filteredDrafts.find((draft) => draft.id === selectedMapId) ?? null,
    [filteredDrafts, selectedMapId]
  );

  const handleOpenDetail = () => {
    if (!selectedDraft || selectedDraft.status !== "done") return;
    const nextUrl = locale
      ? `/${locale}/maps/${selectedDraft.id}`
      : `/maps/${selectedDraft.id}`;
    setOpeningDetailId(selectedDraft.id);
    router.push(nextUrl);
  };

  const handlePrefetchDetail = () => {
    if (!selectedDraft || selectedDraft.status !== "done") return;
    const nextUrl = locale
      ? `/${locale}/maps/${selectedDraft.id}`
      : `/maps/${selectedDraft.id}`;
    router.prefetch(nextUrl);
  };

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const run = async () => {
      setListLoading(true);
      try {
        const { data, error: listError } = await supabase
          .from("maps")
          .select(TERMS_LIST_FIELDS)
          .gt("terms_count", 0)
          .order("updated_at", { ascending: false, nullsFirst: false })
          .limit(200);

        if (listError) throw new Error(tPage("termsTab.errors.load"));
        if (cancelled) return;
        setTermsDrafts(Array.isArray(data) ? data.map((row) => rowToDraft(row as MapRow)) : []);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error && e.message
            ? e.message
            : tPage("termsTab.errors.load")
        );
      } finally {
        if (!cancelled) setListLoading(false);
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
    if (!selectedMapId || !filteredDrafts.some((draft) => draft.id === selectedMapId)) {
      setSelectedMapId(filteredDrafts[0].id);
    }
  }, [filteredDrafts, selectedMapId]);

  useEffect(() => {
    if (!selectedMapId) {
      setTerms([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw new Error(tPage("termsTab.errors.load"));
        const accessToken = sessionData.session?.access_token;
        const base = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!accessToken || !base) throw new Error(tPage("termsTab.errors.load"));

        const res = await fetch(`${base}/maps/${selectedMapId}/terms`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(tPage("termsTab.errors.load"));

        const rows = Array.isArray(json?.terms)
          ? json.terms
          : Array.isArray(json?.items)
          ? json.items
          : [];

        if (cancelled) return;
        setTerms(
          rows.map((row: unknown) => {
            const item = row as {
              term?: unknown;
              meaning?: unknown;
              updated_at?: unknown;
            };
            return {
              term: String(item.term ?? ""),
              meaning: String(item.meaning ?? ""),
              updatedAt: item.updated_at
                ? Date.parse(String(item.updated_at))
                : undefined,
            };
          })
        );
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error && e.message
            ? e.message
            : tPage("termsTab.errors.load")
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedMapId, tPage]);

  if (listLoading) {
    return (
      <section className="grid gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="h-5 w-28 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
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

  if (!error && termsDrafts.length === 0) {
    return (
      <section className="rounded-3xl border border-neutral-200 bg-white p-7 text-sm text-neutral-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
          {tPage("termsTab.title")}
        </h2>
        <p className="mt-2 leading-7">{tPage("termsTab.empty")}</p>
      </section>
    );
  }

  const panelInner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            {tPage("termsTab.title")}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500 dark:text-white/55">
            {tPage("termsTab.leftDescription")}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12px] font-semibold text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70">
          {termsDrafts.length}
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
            placeholder={tPage("termsTab.searchPlaceholder")}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-[14px] text-neutral-800 outline-none transition focus:border-neutral-300 focus:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white/85 dark:focus:border-white/20 dark:focus:bg-white/[0.07]"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "updatedDesc" | "titleAsc")}
          className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[14px] font-medium text-neutral-700 outline-none transition focus:border-neutral-300 focus:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:focus:border-white/20 dark:focus:bg-white/[0.07]"
        >
          <option value="updatedDesc">{tPage("termsTab.sort.updatedDesc")}</option>
          <option value="titleAsc">{tPage("termsTab.sort.titleAsc")}</option>
        </select>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {filteredDrafts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-4 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/50">
            {tPage("termsTab.noSearchResults")}
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
                    <Icon icon="mdi:book-education-outline" className="h-3.5 w-3.5" />
                    {tCommon("content.terms")} {draft.termsCount ?? 0}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] lg:h-[calc(100vh-240px)] lg:overflow-hidden">
        <div className="lg:h-full lg:overflow-y-auto">{panelInner}</div>
      </aside>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] lg:h-[calc(100vh-240px)] lg:overflow-hidden">
        <div className="lg:h-full lg:overflow-y-auto">
          <div className="border-b border-neutral-200 pb-4 dark:border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {selectedDraft
                    ? getDisplayTitle(selectedDraft, untitled)
                    : tPage("fallback.selectedMap")}
                </h2>
                <p className="mt-1 text-[13px] text-neutral-500 dark:text-white/55">
                  {tPage("termsTab.rightDescription")}
                </p>
              </div>
              {selectedDraft?.status === "done" ? (
                <button
                  type="button"
                  onClick={handleOpenDetail}
                  onMouseEnter={handlePrefetchDetail}
                  onFocus={handlePrefetchDetail}
                  disabled={openingDetailId === selectedDraft.id}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-white disabled:cursor-wait disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:hover:bg-white/[0.08]"
                >
                  <Icon
                    icon={openingDetailId === selectedDraft.id ? "mdi:loading" : "mdi:open-in-new"}
                    className={`h-3.5 w-3.5 ${openingDetailId === selectedDraft.id ? "animate-spin" : ""}`}
                  />
                  {openingDetailId === selectedDraft.id
                    ? tCommon("listItem.opening")
                    : tCommon("listItem.open")}
                </button>
              ) : null}
            </div>
            {!loading && !error ? (
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12px] text-neutral-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
                  <Icon icon="mdi:book-education-outline" className="h-3.5 w-3.5" />
                  <span className="font-medium">{tPage("termsTab.summary")}</span>
                  <span className="font-semibold">{terms.length}</span>
                </span>
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
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : terms.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-4 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/50">
              {tPage("termsTab.emptyTerms")}
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {terms.map((item, index) => (
                <div
                  key={`${item.term}-${index}`}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="text-[14px] font-semibold leading-6 text-neutral-900 dark:text-white">
                    {item.term}
                  </div>
                  <div className="mt-2 text-[14px] leading-7 text-neutral-700 dark:text-white/75">
                    {item.meaning}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
