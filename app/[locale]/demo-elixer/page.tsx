"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import type { Theme } from "mind-elixir";
import MapControls from "@/components/maps/MapControls";
import {
  DEFAULT_THEME_NAME,
  MIND_THEME_BY_NAME,
  MIND_THEMES,
} from "@/components/maps/themes";

import type { ClientMindElixirHandle } from "@/components/ClientMindElixir";

const ClientMindElixir = dynamic(() => import("@/components/ClientMindElixir"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[1300px] w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
      <span className="text-slate-500 dark:text-slate-400">마인드맵 로딩 중…</span>
    </div>
  ),
});


// export const metadata = {
//   title: "Mind-Elixir Demo | demo-elixir",
// };

export default function Page() {
  const mindRef = useRef<ClientMindElixirHandle | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchIndexRef = useRef(0);
  const lastStepAtRef = useRef(0);
  const [themeName, setThemeName] = useState<string>(DEFAULT_THEME_NAME);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; text: string }>>([]);
  const [searchIndex, setSearchIndex] = useState(0);

  const themeOptions = useMemo(() => [{ name: DEFAULT_THEME_NAME }, ...MIND_THEMES], []);
  const appliedTheme = useMemo<Theme | undefined>(() => {
    if (themeName === DEFAULT_THEME_NAME) return undefined;
    return MIND_THEME_BY_NAME[themeName];
  }, [themeName]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchIndex(0);
    searchIndexRef.current = 0;
    mindRef.current?.clearSearchHighlights?.();
    mindRef.current?.setSearchActive?.(null);
  };

  const stepSearch = (dir: 1 | -1) => {
    if (!searchResults.length) return;
    const now = Date.now();
    if (now - lastStepAtRef.current < 120) return;
    lastStepAtRef.current = now;
    const current = searchIndexRef.current;
    const next = (current + dir + searchResults.length) % searchResults.length;
    searchIndexRef.current = next;
    setSearchIndex(next);
    const id = searchResults[next]?.id;
    if (id) {
      mindRef.current?.setSearchActive?.(id);
      mindRef.current?.focusNodeById?.(id);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const q = value.trim();
    if (!q) {
      setSearchResults([]);
      setSearchIndex(0);
      searchIndexRef.current = 0;
      mindRef.current?.clearSearchHighlights?.();
      mindRef.current?.setSearchActive?.(null);
      return;
    }

    const results =
      mindRef.current?.findNodesByQuery?.(q, { includeNotes: true }) ?? [];
    setSearchResults(results);
    setSearchIndex(0);
    searchIndexRef.current = 0;
    mindRef.current?.setSearchHighlights?.(results.map((result) => result.id), q);
    if (results[0]?.id) {
      mindRef.current?.setSearchActive?.(results[0].id);
    } else {
      mindRef.current?.setSearchActive?.(null);
    }
  };

  return (
    <div className="flex h-[100vh] flex-col gap-4 p-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Mind-Elixir Demo (damo-elixir)</h1>
            <p className="text-sm text-slate-600">
              로그인 없이 편집, 컨트롤바, 검색 하이라이트/포커스까지 같이 확인하는 데모예요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MapControls
              editMode="edit"
              panMode={false}
              themes={themeOptions}
              currentThemeName={themeName}
              onToggleEdit={() => {}}
              onTogglePanMode={() => {}}
              onSelectTheme={setThemeName}
              onCollapseAll={() => mindRef.current?.collapseAll?.()}
              onExpandAll={() => mindRef.current?.expandAll?.()}
              onExpandLevel={() => mindRef.current?.expandOneLevel?.()}
              onCollapseLevel={() => mindRef.current?.collapseOneLevel?.()}
              onAlignLeft={() => mindRef.current?.setLayout?.("left")}
              onAlignRight={() => mindRef.current?.setLayout?.("right")}
              onAlignSide={() => mindRef.current?.setLayout?.("side")}
              onCenterMap={() => mindRef.current?.centerMap?.()}
              onZoomIn={() => mindRef.current?.zoomIn?.()}
              onZoomOut={() => mindRef.current?.zoomOut?.()}
              onExportPng={async () => {
                await mindRef.current?.exportPng?.();
              }}
              placement="inline"
              hideEditToggle
              hidePanToggle
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {searchOpen ? (
            <div className="relative z-[40] flex w-full items-center gap-2 rounded-xl border border-neutral-900 bg-black px-2 py-1 text-[11px] text-white shadow-sm sm:w-auto">
              <Icon icon="mdi:magnify" className="h-3.5 w-3.5" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.repeat) {
                    e.preventDefault();
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    closeSearch();
                    return;
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    stepSearch(e.shiftKey ? -1 : 1);
                    return;
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    stepSearch(1);
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    stepSearch(-1);
                  }
                }}
                placeholder="검색"
                className="w-full bg-transparent text-[11px] text-white outline-none placeholder:text-white/60 sm:w-[180px]"
              />
              <span className="text-[10px] text-white/70">
                {searchResults.length ? `${searchIndex + 1}/${searchResults.length}` : "0"}
              </span>
              <button
                type="button"
                onClick={() => stepSearch(-1)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-md hover:bg-white/10"
                aria-label="이전 결과"
              >
                <Icon icon="mdi:chevron-up" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => stepSearch(1)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-md hover:bg-white/10"
                aria-label="다음 결과"
              >
                <Icon icon="mdi:chevron-down" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={closeSearch}
                className="inline-flex h-5 w-5 items-center justify-center rounded-md hover:bg-white/10"
                aria-label="검색 닫기"
              >
                <Icon icon="mdi:close" className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true);
                window.setTimeout(() => searchInputRef.current?.focus(), 0);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:text-slate-950"
            >
              <Icon icon="mdi:magnify" className="h-4 w-4" />
              검색 테스트
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ClientMindElixir
          ref={mindRef}
          mode="light"
          theme={appliedTheme}
          openMenuOnClick={false}
          disableDirectContextMenu
          showSelectionContextMenuButton
        />
      </div>
    </div>
  );
}
