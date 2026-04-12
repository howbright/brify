"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Search,
  UserRoundSearch,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

type AdminUserSearchItem = {
  id: string;
  email: string | null;
  role: string;
  creditsFree: number;
  creditsPaid: number;
  creditsTotal: number;
  createdAt: string | null;
};

type AdminUserSearchResponse = {
  items: AdminUserSearchItem[];
  query: string;
  limit: number;
};

type AdminUserMapItem = {
  id: string;
  title: string;
  shortTitle: string | null;
  mapStatus: string;
  sourceType: string;
  sourceUrl: string | null;
  outputLanguage: string | null;
  creditsCharged: number;
  sourceCharCount: number;
  extractError: string | null;
  extractJobId: string | null;
  aiProcessingMs: number;
  createdAt: string;
  updatedAt: string;
};

type AdminUserMapsResponse = {
  user: AdminUserSearchItem;
  items: AdminUserMapItem[];
  limit: number;
};

type AdminMapInspectResponse = {
  id: string;
  userId: string;
  title: string;
  shortTitle: string | null;
  description: string | null;
  summary: string | null;
  tags: string[];
  mapStatus: string;
  extractStatus: string;
  extractError: string | null;
  extractJobId: string | null;
  sourceType: string;
  sourceUrl: string | null;
  sourceCharCount: number;
  outputLanguage: string | null;
  creditsCharged: number;
  aiProcessingMs: number;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl: string | null;
  channelName: string | null;
  mindElixir: unknown;
};

function formatDateTime(value: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusTone(status: string) {
  if (status === "done") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "failed") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function AdminUserMapsPage() {
  const pathname = usePathname();
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AdminUserSearchItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserSearchItem | null>(null);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsData, setMapsData] = useState<AdminUserMapsResponse | null>(null);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [mapDetailLoading, setMapDetailLoading] = useState(false);
  const [mapDetail, setMapDetail] = useState<AdminMapInspectResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedMap = useMemo(
    () => mapsData?.items.find((item) => item.id === selectedMapId) ?? null,
    [mapsData, selectedMapId]
  );

  useEffect(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const selectedEmail = selectedUser?.email?.trim().toLowerCase() ?? null;

    if (selectedUser && normalizedSearch !== selectedEmail) {
      setSelectedUser(null);
      setMapsData(null);
      setSelectedMapId(null);
      setMapDetail(null);
    }
  }, [searchText, selectedUser]);

  useEffect(() => {
    const keyword = searchText.trim();

    if (keyword.length < 2) {
      setSearching(false);
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setSearching(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl) {
          throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았어요.");
        }

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const accessToken = session?.access_token;
        if (!accessToken) {
          throw new Error("관리자 세션을 찾지 못했어요. 다시 로그인해 주세요.");
        }

        const url = new URL(`${baseUrl}/admin/users/search`);
        url.searchParams.set("q", keyword);
        url.searchParams.set("limit", "8");

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("사용자 검색에 실패했어요.");
        }

        const data = (await response.json()) as AdminUserSearchResponse;
        if (!cancelled) {
          setSearchResults(data.items);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "사용자 검색 중 오류가 발생했어요.";
          setErrorMessage(message);
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchText]);

  async function fetchUserMaps(user: AdminUserSearchItem) {
    setSelectedUser(user);
    setSearchText(user.email ?? "");
    setSearchResults([]);
    setMapsLoading(true);
    setSelectedMapId(null);
    setMapDetail(null);
    setErrorMessage(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았어요.");
      }

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("관리자 세션을 찾지 못했어요. 다시 로그인해 주세요.");
      }

      const response = await fetch(`${baseUrl}/admin/users/${user.id}/maps?limit=30`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("사용자 맵 목록을 불러오지 못했어요.");
      }

      const data = (await response.json()) as AdminUserMapsResponse;
      setMapsData(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "사용자 맵을 불러오는 중 오류가 발생했어요.";
      setErrorMessage(message);
      toast.error(message);
      setMapsData(null);
    } finally {
      setMapsLoading(false);
    }
  }

  async function fetchMapDetail(mapId: string) {
    setSelectedMapId(mapId);
    setMapDetailLoading(true);
    setErrorMessage(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았어요.");
      }

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("관리자 세션을 찾지 못했어요. 다시 로그인해 주세요.");
      }

      const response = await fetch(`${baseUrl}/admin/maps/${mapId}/inspect`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("맵 상세를 불러오지 못했어요.");
      }

      const data = (await response.json()) as AdminMapInspectResponse;
      setMapDetail(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "맵 상세를 불러오는 중 오류가 발생했어요.";
      setErrorMessage(message);
      toast.error(message);
      setMapDetail(null);
    } finally {
      setMapDetailLoading(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_500px_at_88%_-10%,rgba(14,165,233,0.16),transparent_65%),radial-gradient(760px_460px_at_0%_0%,rgba(59,130,246,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_78%)]" />

      <main className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-slate-800 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)]">
          <UserRoundSearch className="h-3.5 w-3.5" />
          ADMIN USER MAPS
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-950 sm:text-[32px]">
              사용자별 구조맵 조회
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600 sm:text-base">
              사용자를 이메일로 검색하고, 그 사용자의 구조맵 목록과 실패 사유, 요약, 태그를 빠르게 확인해요.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={pathname.replace(/\/users\/maps$/, "") || "/admin"}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              관리자 홈
            </Link>
            <Link
              href={pathname.replace(/\/users\/maps$/, "/ops/maps")}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              구조맵 운영 현황
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)_420px]">
          <section className="rounded-[28px] border border-slate-300 bg-white/92 p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
            <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">사용자 검색</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              `profiles.email` 기준으로 부분 검색합니다.
            </p>

            <div className="mt-5">
              <label className="block">
                <div className="text-sm font-semibold text-neutral-800">이메일 검색</div>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) => {
                      setSearchText(event.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="이메일 일부를 입력해 주세요."
                    className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </label>

              <div className="mt-2 min-h-6 text-xs text-neutral-500">
                {searching
                  ? "검색 중..."
                  : searchText.trim().length < 2
                    ? "2글자 이상 입력하면 검색 결과가 나타나요."
                    : searchResults.length > 0
                      ? "검색 결과에서 사용자를 선택해 주세요."
                      : "일치하는 사용자가 없어요."}
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80">
              {searchResults.length > 0 ? (
                searchResults.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => void fetchUserMaps(user)}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 text-left last:border-b-0",
                        isSelected ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-100"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{user.email ?? "(email 없음)"}</div>
                        <div className={cn("mt-1 text-xs", isSelected ? "text-slate-200" : "text-neutral-500")}>
                          {user.role} · free {user.creditsFree.toLocaleString()} · total {user.creditsTotal.toLocaleString()}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-5 text-sm text-neutral-500">
                  검색 결과가 여기에 표시돼요.
                </div>
              )}
            </div>

            {selectedUser ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-neutral-700">
                <div className="font-semibold text-neutral-950">{selectedUser.email ?? "(email 없음)"}</div>
                <div className="mt-1">role: {selectedUser.role}</div>
                <div className="mt-1">
                  free {selectedUser.creditsFree.toLocaleString()} · paid {selectedUser.creditsPaid.toLocaleString()} · total{" "}
                  {selectedUser.creditsTotal.toLocaleString()}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-slate-300 bg-white/92 p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">사용자 맵 목록</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  상태와 실패 사유를 보고 문제가 있는 맵을 빠르게 골라볼 수 있어요.
                </p>
              </div>
              {mapsLoading ? <LoaderCircle className="h-4 w-4 animate-spin text-neutral-400" /> : null}
            </div>

            {mapsData ? (
              <div className="mt-5 space-y-3">
                <div className="text-sm text-neutral-500">
                  총 {mapsData.items.length}개 맵
                </div>
                <div className="space-y-3">
                  {mapsData.items.map((item) => {
                    const isSelected = selectedMapId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void fetchMapDetail(item.id)}
                        className={cn(
                          "w-full rounded-2xl border px-4 py-4 text-left transition-all",
                          isSelected
                            ? "border-slate-900 bg-slate-900 text-white shadow-md"
                            : "border-slate-200 bg-slate-50/80 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold",
                              isSelected ? "border-white/20 bg-white/10 text-white" : getStatusTone(item.mapStatus)
                            )}
                          >
                            {item.mapStatus}
                          </span>
                          <span className={cn("text-[11px]", isSelected ? "text-slate-200" : "text-neutral-500")}>
                            {item.sourceType} · {formatDateTime(item.updatedAt)}
                          </span>
                        </div>
                        <div className="mt-3 text-sm font-semibold">
                          {item.shortTitle || item.title}
                        </div>
                        {item.shortTitle && item.shortTitle !== item.title ? (
                          <div className={cn("mt-1 text-xs", isSelected ? "text-slate-200" : "text-neutral-500")}>
                            원본 제목: {item.title}
                          </div>
                        ) : null}
                        <div className={cn("mt-2 text-xs", isSelected ? "text-slate-200" : "text-neutral-500")}>
                          크레딧 {item.creditsCharged} · 글자수 {item.sourceCharCount.toLocaleString()} · 언어 {item.outputLanguage ?? "-"}
                        </div>
                        {item.extractError ? (
                          <div
                            className={cn(
                              "mt-3 rounded-xl border px-3 py-2 text-xs",
                              isSelected
                                ? "border-white/15 bg-white/10 text-white"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            )}
                          >
                            실패 사유: {item.extractError}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-neutral-500">
                사용자를 선택하면 해당 사용자의 맵 목록이 여기에 표시돼요.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-slate-300 bg-white/92 p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">맵 상세</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  요약, 태그, 생성 상태를 보고 사용자 문의를 빠르게 확인해요.
                </p>
              </div>
              {mapDetailLoading ? <LoaderCircle className="h-4 w-4 animate-spin text-neutral-400" /> : null}
            </div>

            {errorMessage ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            ) : null}

            {mapDetail ? (
              <div className="mt-5 space-y-4 text-sm text-neutral-700">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold", getStatusTone(mapDetail.mapStatus))}>
                        {mapDetail.mapStatus}
                      </span>
                      <span className="text-xs text-neutral-500">{mapDetail.extractStatus}</span>
                    </div>
                    <Link
                      href={pathname.replace(/\/users\/maps$/, `/${mapDetail.id}`)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      구조맵 열기
                    </Link>
                  </div>
                  <div className="mt-3 text-base font-bold text-neutral-950">
                    {mapDetail.shortTitle || mapDetail.title}
                  </div>
                  {mapDetail.shortTitle && mapDetail.shortTitle !== mapDetail.title ? (
                    <div className="mt-1 text-xs text-neutral-500">원본 제목: {mapDetail.title}</div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">생성일</div>
                    <div className="mt-1">{formatDateTime(mapDetail.createdAt)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">업데이트</div>
                    <div className="mt-1">{formatDateTime(mapDetail.updatedAt)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">크레딧 / 처리시간</div>
                    <div className="mt-1">
                      {mapDetail.creditsCharged}cr / {mapDetail.aiProcessingMs ? `${mapDetail.aiProcessingMs}ms` : "-"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">소스</div>
                    <div className="mt-1">{mapDetail.sourceType} · {mapDetail.outputLanguage ?? "-"}</div>
                  </div>
                </div>

                {mapDetail.extractError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <div className="font-semibold">실패 사유</div>
                    <div className="mt-1 whitespace-pre-line">{mapDetail.extractError}</div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>현재 저장된 요약/메타데이터를 확인할 수 있어요.</span>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">태그</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mapDetail.tags.length > 0 ? (
                      mapDetail.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-neutral-500">태그가 없어요.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">요약</div>
                  <div className="mt-2 whitespace-pre-line text-sm leading-6 text-neutral-700">
                    {mapDetail.summary || "요약이 없어요."}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">설명 / 링크</div>
                  <div className="mt-2 space-y-2">
                    <div>{mapDetail.description || "설명이 없어요."}</div>
                    <div className="break-all text-xs text-neutral-500">{mapDetail.sourceUrl || "-"}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-neutral-500">
                맵을 선택하면 상세 정보가 여기에 표시돼요.
                {selectedMap ? (
                  <div className="mt-2">선택된 맵: {selectedMap.shortTitle || selectedMap.title}</div>
                ) : null}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
