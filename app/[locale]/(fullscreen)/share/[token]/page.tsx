"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import ClientMindElixir, {
  type ClientMindElixirHandle,
} from "@/components/ClientMindElixir";
import { MIND_THEME_BY_NAME } from "@/components/maps/themes";
import { loadingMindElixir } from "@/app/lib/g6/sampleData";

type SharedMapPayload = {
  id: string;
  title: string;
  mind_elixir: any | null;
  mind_theme_override: string | null;
  map_status: string;
  updated_at: string;
};

const DEFAULT_THEME_NAME = "Default";

export default function SharedMapPage() {
  const params = useParams();
  const { resolvedTheme: themeMode } = useTheme();
  const token = String(params?.token ?? "");

  const mindRef = useRef<ClientMindElixirHandle | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<any | null>(null);
  const [mapTitle, setMapTitle] = useState<string>("공유된 구조맵");
  const [themeName, setThemeName] = useState<string>(DEFAULT_THEME_NAME);
  const [error, setError] = useState<string | null>(null);
  const [panMode, setPanMode] = useState(false);
  const [mapActionsOpen, setMapActionsOpen] = useState(false);
  const mapActionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/share/${token}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || "공유 링크가 유효하지 않습니다.");
        }
        const map: SharedMapPayload | null = json?.map ?? null;
        if (!map?.mind_elixir) {
          throw new Error("구조맵 데이터를 불러오지 못했습니다.");
        }
        if (cancelled) return;
        setMapTitle(map.title || "공유된 구조맵");
        setMapData(map.mind_elixir);
        setThemeName(map.mind_theme_override ?? DEFAULT_THEME_NAME);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "공유 링크를 불러오지 못했습니다.");
        setMapData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    mindRef.current?.setPanMode?.(panMode);
  }, [panMode]);

  useEffect(() => {
    if (!mapActionsOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (mapActionsRef.current?.contains(target)) return;
      setMapActionsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mapActionsOpen]);

  const resolvedTheme = useMemo(() => {
    if (!themeName || themeName === DEFAULT_THEME_NAME) return null;
    return MIND_THEME_BY_NAME[themeName] ?? null;
  }, [themeName]);

  const handleExportPng = async () => {
    const blob = await mindRef.current?.exportPng?.();
    if (!blob) {
      toast.message("이미지 저장에 실패했습니다.");
      return;
    }
    const safeTitle = (mapTitle || "map").replace(/[\\/:*?"<>|]+/g, "-").trim();
    const date = new Date();
    const stamp = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("");
    const fileName = `${safeTitle || "map"}-${stamp}.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-white dark:bg-[#0b1220] [--header-h:56px]">
      <header
        className="relative z-[20] w-full border-b border-neutral-200/80 dark:border-white/10"
        style={{ height: "var(--header-h)" }}
      >
        <div className="h-full px-4 flex items-center justify-between gap-4 bg-white/92 backdrop-blur dark:bg-[#0b1220]/88">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-white/45">
              공유 보기
            </div>
            <div className="truncate text-sm font-semibold text-neutral-800 dark:text-white/90">
              {mapTitle}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-md border border-neutral-200/70 px-1 py-0.5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    if (panMode) setPanMode(false);
                  }}
                  className={`
                    inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-semibold transition-colors
                    ${!panMode
                      ? "text-blue-800 dark:text-blue-100 bg-blue-100/70 dark:bg-blue-500/20 rounded-md shadow-[inset_0_1px_2px_rgba(15,23,42,0.25),inset_0_0_0_1px_rgba(59,130,246,0.35)]"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"}
                  `}
                  aria-label="선택 모드"
                  title="선택 모드"
                >
                  <Icon icon="mdi:arrow-top-left" className="h-3.5 w-3.5" />
                  <span className="hidden min-[680px]:inline">선택</span>
                </button>
                <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                <button
                  type="button"
                  onClick={() => {
                    if (!panMode) setPanMode(true);
                  }}
                  className={`
                    inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-semibold transition-colors
                    ${panMode
                      ? "text-blue-800 dark:text-blue-100 bg-blue-100/70 dark:bg-blue-500/20 rounded-md shadow-[inset_0_1px_2px_rgba(15,23,42,0.25),inset_0_0_0_1px_rgba(59,130,246,0.35)]"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"}
                  `}
                  aria-label="이동 모드"
                  title="이동 모드"
                >
                  <Icon icon="mdi:hand-back-left" className="h-3.5 w-3.5" />
                  <span className="hidden min-[680px]:inline">이동</span>
                </button>
              </div>

              <div className="inline-flex items-center gap-1 rounded-md border border-neutral-200/70 px-1 py-0.5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => mindRef.current?.collapseAll?.()}
                  className="
                    inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-semibold
                    text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white
                  "
                >
                  <Icon icon="mdi:collapse-all-outline" className="h-3.5 w-3.5" />
                  <span className="hidden min-[680px]:inline">전체 접기</span>
                </button>
                <span className="h-3 w-px bg-neutral-200 dark:bg-white/15" />
                <div className="relative" ref={mapActionsRef}>
                  <button
                    type="button"
                    onClick={() => setMapActionsOpen((v) => !v)}
                    className="
                      inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-semibold
                      text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white
                    "
                  >
                    <Icon icon="mdi:vector-polyline" className="h-3.5 w-3.5" />
                    <span className="hidden min-[680px]:inline">맵 조작</span>
                  </button>

                  {mapActionsOpen && (
                    <div className="absolute right-0 mt-2 w-[180px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]">
                      <button
                        type="button"
                        onClick={() => {
                          setMapActionsOpen(false);
                          mindRef.current?.expandAll?.();
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
                      >
                        전체 펴기
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMapActionsOpen(false);
                          mindRef.current?.expandOneLevel?.();
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
                      >
                        한단계 펴기
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMapActionsOpen(false);
                          mindRef.current?.collapseOneLevel?.();
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
                      >
                        한단계 접기
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportPng}
                className="
                  inline-flex items-center gap-1.5 rounded-md border border-neutral-200/70
                  bg-white/90 px-2 py-1 text-[11px] font-semibold text-neutral-700
                  shadow-sm backdrop-blur hover:bg-white
                  dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80 dark:hover:bg-white/10
                "
              >
                <Icon icon="mdi:download" className="h-3.5 w-3.5" />
                PNG 저장
              </button>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-300/40 dark:bg-blue-500/10 dark:text-blue-50/90">
              <Icon icon="mdi:eye-outline" className="h-3.5 w-3.5" />
              읽기 전용
            </span>
          </div>
        </div>
      </header>

      <div className="relative w-full" style={{ height: "calc(100% - var(--header-h))" }}>
        <div className="absolute inset-0 bg-[#f6f7fb] dark:bg-[#070c16]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-30 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
        />

        <div className="absolute inset-0">
          <div className="h-full w-full rounded-2xl border border-neutral-200/70 bg-white/65 backdrop-blur-sm shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <ClientMindElixir
              ref={mindRef}
              mode={themeMode === "dark" ? "dark" : "light"}
              editMode="view"
              theme={resolvedTheme}
              data={mapData ?? undefined}
              loading={loading}
              placeholderData={loadingMindElixir}
            />
          </div>
        </div>

        {error && (
          <div className="absolute left-4 top-3 z-[15]">
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
              <Icon icon="mdi:alert-circle-outline" className="h-3.5 w-3.5" />
              {error}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
