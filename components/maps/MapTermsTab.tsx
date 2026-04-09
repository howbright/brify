"use client";

import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
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

type TermsTabCopy = {
  title: string;
  leftDescription: string;
  rightDescription: string;
  empty: string;
  emptyTerms: string;
  noSearchResults: string;
  searchPlaceholder: string;
  sortUpdatedDesc: string;
  sortTitleAsc: string;
  previewSample: string;
  opening: string;
  open: string;
  selectedMap: string;
  summary: string;
  sampleMapLabel: string;
};

const TERMS_LIST_FIELDS =
  "id,created_at,updated_at,title,short_title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged,terms_count";

const MOCK_DRAFTS: MapDraft[] = [
  {
    id: "demo-fasting-routine",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 30,
    title: "간헐적 단식 루틴 정리",
    shortTitle: "단식 루틴",
    channelName: "Brify Demo",
    tags: ["건강", "루틴"],
    status: "done",
  },
  {
    id: "demo-startup-ops",
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    updatedAt: Date.now() - 1000 * 60 * 90,
    title: "스타트업 운영 회고",
    shortTitle: "운영 회고",
    channelName: "Brify Demo",
    tags: ["업무", "회고"],
    status: "done",
  },
];

const MOCK_TERMS: Record<string, TermItem[]> = {
  "demo-fasting-routine": [
    { term: "OMAD", meaning: "하루 한 끼만 먹는 식사 패턴.", updatedAt: Date.now() - 1000 * 60 * 20 },
    { term: "grass-fed", meaning: "목초 사육 기반 식재료를 뜻하며 영상에서 품질 기준으로 언급된다.", updatedAt: Date.now() - 1000 * 60 * 30 },
    { term: "electrolyte", meaning: "공복 중 수분 균형을 위해 챙기는 전해질.", updatedAt: Date.now() - 1000 * 60 * 50 },
  ],
  "demo-startup-ops": [
    { term: "standup", meaning: "팀 상태와 블로커를 짧게 공유하는 미팅.", updatedAt: Date.now() - 1000 * 60 * 80 },
    { term: "blocker", meaning: "다음 작업을 진행하지 못하게 막는 장애 요소.", updatedAt: Date.now() - 1000 * 60 * 95 },
  ],
};

function getCopy(locale: string): TermsTabCopy {
  if (locale === "ko") {
    return {
      title: "용어 모아보기",
      leftDescription: "용어가 정리된 맵만 따로 모아 빠르게 다시 볼 수 있어요.",
      rightDescription: "선택한 맵에서 추출된 용어와 뜻을 확인합니다.",
      empty: "아직 용어가 정리된 맵이 없습니다.",
      emptyTerms: "선택한 맵에 표시할 용어가 없습니다.",
      noSearchResults: "검색 조건에 맞는 맵이 없습니다.",
      searchPlaceholder: "용어가 있는 맵 검색",
      sortUpdatedDesc: "최근 수정순",
      sortTitleAsc: "제목순",
      previewSample: "프리뷰 샘플",
      opening: "여는 중",
      open: "맵 열기",
      selectedMap: "맵을 선택해 주세요",
      summary: "용어 수",
      sampleMapLabel: "로그인 없이 미리보기 가능한 샘플 데이터입니다.",
    };
  }
  return {
    title: "Terms Library",
    leftDescription: "Browse maps that already have extracted terms.",
    rightDescription: "Review the extracted terms and explanations for the selected map.",
    empty: "There are no maps with terms yet.",
    emptyTerms: "There are no terms to show for this map yet.",
    noSearchResults: "No maps matched your search.",
    searchPlaceholder: "Search maps with terms",
    sortUpdatedDesc: "Recently updated",
    sortTitleAsc: "Title",
    previewSample: "Preview sample",
    opening: "Opening",
    open: "Open map",
    selectedMap: "Select a map",
    summary: "Terms",
    sampleMapLabel: "This is sample data shown without sign-in.",
  };
}

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
    description: row.description ?? undefined,
    summary: row.summary ?? undefined,
    thumbnailUrl: row.thumbnail_url ? withCacheBuster(row.thumbnail_url) : undefined,
    status: coerceMapStatus(row.map_status),
    creditsCharged:
      typeof row.credits_charged === "number" ? row.credits_charged : undefined,
    termsCount: typeof (row as MapRow & { terms_count?: unknown }).terms_count === "number"
      ? ((row as MapRow & { terms_count?: number }).terms_count ?? 0)
      : 0,
  };
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

export default function MapTermsTab() {
  const router = useRouter();
  const locale = useLocale();
  const copy = useMemo(() => getCopy(locale), [locale]);
  const untitled = locale === "ko" ? "제목없음" : "Untitled";

  const [termsDrafts, setTermsDrafts] = useState<MapDraft[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [openingDetailId, setOpeningDetailId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"updatedDesc" | "titleAsc">("updatedDesc");
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [isMockMode, setIsMockMode] = useState(false);

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
    if (!selectedDraft || selectedDraft.status !== "done" || isMockMode) return;
    const nextUrl = locale ? `/${locale}/maps/${selectedDraft.id}` : `/maps/${selectedDraft.id}`;
    setOpeningDetailId(selectedDraft.id);
    router.push(nextUrl);
  };

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const run = async () => {
      setListLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          if (cancelled) return;
          setTermsDrafts(MOCK_DRAFTS);
          setIsMockMode(true);
          return;
        }

        const { data, error: listError } = await supabase
          .from("maps")
          .select(TERMS_LIST_FIELDS)
          .gt("terms_count", 0)
          .order("updated_at", { ascending: false, nullsFirst: false })
          .limit(200);

        if (listError) throw listError;
        if (cancelled) return;
        setTermsDrafts(Array.isArray(data) ? data.map((row) => rowToDraft(row as MapRow)) : []);
        setIsMockMode(false);
      } catch {
        if (cancelled) return;
        setTermsDrafts(MOCK_DRAFTS);
        setIsMockMode(true);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

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

    if (isMockMode) {
      setTerms(MOCK_TERMS[selectedMapId] ?? []);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/maps/${encodeURIComponent(selectedMapId)}/terms`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("terms-load-failed");

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
              updatedAt: item.updated_at ? Date.parse(String(item.updated_at)) : undefined,
            };
          })
        );
      } catch {
        if (cancelled) return;
        setError(locale === "ko" ? "용어를 불러오지 못했습니다." : "Failed to load terms.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isMockMode, locale, selectedMapId]);

  if (listLoading) {
    return (
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="h-5 w-28 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/5" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/5" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!error && termsDrafts.length === 0) {
    return (
      <section className="rounded-3xl border border-neutral-200 bg-white p-7 text-sm text-neutral-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{copy.title}</h2>
        <p className="mt-2 leading-7">{copy.empty}</p>
      </section>
    );
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] lg:h-[calc(100vh-240px)] lg:overflow-hidden">
        <div className="lg:h-full lg:overflow-y-auto">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{copy.title}</h2>
              <p className="mt-1 text-[13px] text-neutral-500 dark:text-white/55">{copy.leftDescription}</p>
            </div>
            <span className="inline-flex items-center rounded-full border border-blue-200/80 bg-blue-50 px-2.5 py-1 text-[12px] font-semibold text-blue-700 dark:border-blue-300/18 dark:bg-blue-400/10 dark:text-blue-200">
              {termsDrafts.length}
            </span>
          </div>

          {isMockMode ? (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-700 dark:border-amber-300/18 dark:bg-amber-400/10 dark:text-amber-200">
              <Icon icon="mdi:flask-outline" className="h-3.5 w-3.5" />
              {copy.previewSample}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2">
            <div className="relative">
              <Icon icon="mdi:magnify" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="w-full rounded-2xl border border-slate-400 bg-neutral-50 py-2.5 pl-9 pr-3 text-[14px] text-neutral-800 outline-none transition focus:border-slate-500 focus:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white/85 dark:focus:border-white/20 dark:focus:bg-white/[0.07]"
              />
            </div>
            <div className="flex justify-end">
              <div className="relative w-full sm:w-auto sm:min-w-[148px]">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "updatedDesc" | "titleAsc")}
                  className="w-full appearance-none rounded-2xl border border-neutral-200 bg-neutral-50 py-1 pl-2 pr-10 text-[14px] font-medium text-neutral-700 outline-none transition focus:border-neutral-300 focus:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:focus:border-white/20 dark:focus:bg-white/[0.07]"
                >
                  <option value="updatedDesc">{copy.sortUpdatedDesc}</option>
                  <option value="titleAsc">{copy.sortTitleAsc}</option>
                </select>
                <Icon icon="mdi:chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 dark:text-white/55" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {filteredDrafts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-4 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/50">
                {copy.noSearchResults}
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
                        ? "border-[color:var(--color-primary-600)] bg-[rgba(37,99,235,0.08)] text-neutral-900 shadow-[0_16px_32px_-28px_rgba(37,99,235,0.28)] dark:border-[color:var(--color-primary-400)] dark:bg-[rgba(96,165,250,0.12)] dark:text-white"
                        : "border-neutral-200 bg-white text-neutral-800 hover:border-[rgba(59,130,246,0.28)] hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/85 dark:hover:border-[rgba(96,165,250,0.26)] dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="line-clamp-2 text-[14px] font-semibold leading-6">
                      {getDisplayTitle(draft, untitled)}
                    </div>
                    <div className={`mt-1 text-[12px] ${isSelected ? "text-neutral-600 dark:text-white/68" : "text-neutral-500 dark:text-white/45"}`}>
                      {formatTimestamp(draft.updatedAt ?? draft.createdAt)}
                    </div>
                    <div className={`mt-2 flex flex-wrap items-center gap-1.5 text-[12px] ${isSelected ? "text-neutral-700 dark:text-white/78" : "text-neutral-500 dark:text-white/55"}`}>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                        isSelected
                          ? "bg-[rgba(37,99,235,0.1)] text-[color:var(--color-primary-700)] dark:bg-[rgba(96,165,250,0.14)] dark:text-sky-200"
                          : "bg-neutral-100 text-[color:var(--color-primary-700)] dark:bg-white/10 dark:text-sky-200/80"
                      }`}>
                        <Icon icon="mdi:book-education-outline" className="h-3.5 w-3.5" />
                        {copy.summary} {draft.termsCount ?? 0}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </aside>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] lg:h-[calc(100vh-240px)] lg:overflow-hidden">
        <div className="lg:h-full lg:overflow-y-auto">
          <div className="border-b border-neutral-200 pb-4 dark:border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {selectedDraft ? getDisplayTitle(selectedDraft, untitled) : copy.selectedMap}
                </h2>
                <p className="mt-1 text-[13px] text-neutral-500 dark:text-white/55">{copy.rightDescription}</p>
              </div>
              {selectedDraft?.status === "done" && !isMockMode ? (
                <button
                  type="button"
                  onClick={handleOpenDetail}
                  disabled={openingDetailId === selectedDraft.id}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-white disabled:cursor-wait disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:hover:bg-white/[0.08]"
                >
                  <Icon
                    icon={openingDetailId === selectedDraft.id ? "mdi:loading" : "mdi:open-in-new"}
                    className={`h-3.5 w-3.5 ${openingDetailId === selectedDraft.id ? "animate-spin" : ""}`}
                  />
                  {openingDetailId === selectedDraft.id ? copy.opening : copy.open}
                </button>
              ) : null}
            </div>
            {!loading && !error ? (
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-neutral-50 px-2.5 py-1 text-[12px] text-blue-700 dark:border-blue-300/14 dark:bg-white/[0.05] dark:text-blue-200">
                  <Icon icon="mdi:book-education-outline" className="h-3.5 w-3.5" />
                  <span className="font-medium">{copy.summary}</span>
                  <span className="font-semibold">{terms.length}</span>
                </span>
              </div>
            ) : null}
            {isMockMode ? (
              <p className="mt-3 text-[12px] text-neutral-500 dark:text-white/50">{copy.sampleMapLabel}</p>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/5" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : terms.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-4 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/50">
              {copy.emptyTerms}
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {terms.map((item, index) => (
                <div key={`${item.term}-${index}`} className="rounded-2xl border border-blue-200/55 bg-neutral-50/80 p-4 dark:border-blue-300/12 dark:bg-white/[0.03]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[14px] font-semibold leading-6 text-neutral-900 dark:text-white">{item.term}</div>
                    {item.updatedAt ? (
                      <div className="text-[11px] text-neutral-500 dark:text-white/40">{formatTimestamp(item.updatedAt)}</div>
                    ) : null}
                  </div>
                  <div className="mt-2 text-[14px] leading-7 text-neutral-700 dark:text-white/75">{item.meaning}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
