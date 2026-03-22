"use client";

import type { ReactNode } from "react";

type TagCount = { name: string; count: number };
const NO_TAG_FILTER = "__NO_TAG__";

type TagPanelProps = {
  tagListQuery: string;
  onTagListQueryChange: (value: string) => void;
  tagsLoading: boolean;
  tagOptions: TagCount[];
  tagSort: "recent" | "name" | "count_desc" | "count_asc";
  onTagSortChange: (value: "recent" | "name" | "count_desc" | "count_asc") => void;
  onDeleteTag: (tag: string) => void;
  selectedTags: string[];
  onToggleSelect: (tag: string) => void;
  onOpenMerge: () => void;
  containerClassName?: string;
  panelClassName?: string;
  listClassName?: string;
  headerAccessory?: ReactNode;
};

export default function TagPanel({
  tagListQuery,
  onTagListQueryChange,
  tagsLoading,
  tagOptions,
  tagSort,
  onTagSortChange,
  onDeleteTag,
  selectedTags,
  onToggleSelect,
  onOpenMerge,
  containerClassName = "hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-160px)]",
  panelClassName = "rounded-2xl border border-blue-200 bg-white p-4 shadow-sm dark:border-blue-500/20 dark:bg-white/[0.04]",
  listClassName = "mt-3 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-1",
  headerAccessory,
}: TagPanelProps) {
  const mergeSelectableCount = selectedTags.filter(
    (tag) => tag !== NO_TAG_FILTER
  ).length;

  return (
    <section className={containerClassName}>
      <div className={panelClassName}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            태그
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={tagSort}
              onChange={(event) =>
                onTagSortChange(
                  event.target.value as
                    | "recent"
                    | "name"
                    | "count_desc"
                    | "count_asc"
                )
              }
              className="rounded-full border border-slate-600 bg-neutral-50 px-3 py-1.5 text-[13px] font-semibold text-neutral-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-white/25 dark:bg-white/[0.08] dark:text-white"
              aria-label="태그 정렬"
            >
              <option value="recent">최신</option>
              <option value="name">이름순</option>
              <option value="count_desc">많이 쓰인 순</option>
              <option value="count_asc">적게 쓰인 순</option>
            </select>
            {headerAccessory}
          </div>
        </div>
        {selectedTags.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
            <span className="text-[11px] font-semibold text-neutral-600 dark:text-white/70">
              필터링 중
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-500 bg-neutral-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm dark:border-white/20 dark:bg-white/15 dark:text-white"
                >
                  {tag === NO_TAG_FILTER ? "특별한 태그없음" : `#${tag}`}
                  <button
                    type="button"
                    onClick={() => onToggleSelect(tag)}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white/70 hover:bg-white/15 hover:text-white"
                    aria-label={`${tag === NO_TAG_FILTER ? "특별한 태그없음" : tag} 선택 해제`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>{selectedTags.length}개 선택됨</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenMerge}
                  disabled={mergeSelectableCount < 2}
                  className="rounded-full border border-blue-500/70 bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-blue-200 disabled:bg-blue-100 disabled:text-blue-300 dark:disabled:border-blue-500/20 dark:disabled:bg-blue-500/10 dark:disabled:text-blue-200/40"
                >
                  태그합치기
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="mt-3 relative flex items-center">
          <input
            value={tagListQuery}
            onChange={(event) => onTagListQueryChange(event.target.value)}
            placeholder="태그 검색"
            className="w-full rounded-full border border-slate-600 bg-white px-3.5 py-2 pr-9 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200/70 dark:border-white/25 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-white/40 dark:focus:border-blue-300 dark:focus:ring-blue-500/20"
          />
          {tagListQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={() => onTagListQueryChange("")}
              className="absolute right-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-blue-400 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-200/70 dark:hover:bg-blue-500/20"
              aria-label="검색어 지우기"
            >
              ×
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onToggleSelect(NO_TAG_FILTER)}
          className={`mt-2 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs shadow-sm transition ${
            selectedTags.includes(NO_TAG_FILTER)
              ? "border-neutral-900 bg-neutral-200 text-neutral-900"
              : "border-neutral-900 bg-neutral-100 text-neutral-700"
          } dark:border-white/25 dark:bg-white/[0.08] dark:text-white/80`}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedTags.includes(NO_TAG_FILTER)}
              onChange={() => onToggleSelect(NO_TAG_FILTER)}
              onClick={(event) => event.stopPropagation()}
              className="h-3.5 w-3.5 rounded border-neutral-400 text-neutral-700"
            />
            <span className="font-semibold">특별한 태그없음</span>
          </div>
        </button>
        <div className={listClassName}>
          <div className="flex flex-col gap-3">
            {tagsLoading && (
              <>
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-10 w-full animate-pulse rounded-xl bg-blue-50 dark:bg-blue-500/10"
                  />
                ))}
              </>
            )}
            {!tagsLoading &&
              tagOptions.length === 0 && (
                <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                  태그가 없습니다.
                </div>
              )}
            {!tagsLoading && tagOptions.length > 0 && (
              <div className="flex flex-col gap-2">
                {tagOptions.map((tag) => (
                  <div key={tag.name}>
                    <div
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs shadow-sm transition ${
                        selectedTags.includes(tag.name)
                          ? "border-blue-500 bg-blue-100 text-blue-800"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      } dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.name)}
                          onChange={() => onToggleSelect(tag.name)}
                          className="h-3.5 w-3.5 rounded border-blue-200 text-blue-600"
                        />
                        <span className="font-semibold">#{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-blue-700/70 dark:text-blue-200/70">
                          {tag.count}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteTag(tag.name);
                          }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-200 text-blue-400 hover:bg-blue-100 hover:text-blue-700 dark:border-blue-500/30 dark:text-blue-200/70 dark:hover:bg-blue-500/20"
                          aria-label="태그 삭제"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
