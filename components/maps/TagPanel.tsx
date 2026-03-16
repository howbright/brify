"use client";

type TagCount = { name: string; count: number };

type TagPanelProps = {
  tagOrganizeFilter: string | null;
  onFilterSelect: (tag: string) => void;
  onFilterClear: () => void;
  manualTagInput: string;
  onManualTagInputChange: (value: string) => void;
  onManualTagAdd: () => void;
  tagsLoading: boolean;
  manualTagOptions: TagCount[];
  recentTagOptions: TagCount[];
  allTagOptions: TagCount[];
  onDeleteTag: (tag: string) => void;
  selectedTags: string[];
  onToggleSelect: (tag: string) => void;
  onClearSelection: () => void;
  onOpenMerge: () => void;
};

export default function TagPanel({
  tagOrganizeFilter,
  onFilterSelect,
  onFilterClear,
  manualTagInput,
  onManualTagInputChange,
  onManualTagAdd,
  tagsLoading,
  manualTagOptions,
  recentTagOptions,
  allTagOptions,
  onDeleteTag,
  selectedTags,
  onToggleSelect,
  onClearSelection,
  onOpenMerge,
}: TagPanelProps) {
  return (
    <section className="hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-160px)]">
      <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm dark:border-blue-500/20 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            태그
          </h3>
        </div>
        {selectedTags.length > 0 && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
            <span>{selectedTags.length}개 선택됨</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenMerge}
                className="rounded-full border border-blue-500/70 bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                태그합치기
              </button>
              <button
                type="button"
                onClick={onClearSelection}
                className="rounded-full border border-blue-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-white/10 dark:text-blue-200 dark:hover:bg-blue-500/20"
              >
                선택 해제
              </button>
            </div>
          </div>
        )}
        {tagOrganizeFilter && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-600 dark:text-white/70">
            <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 font-semibold text-white shadow-sm dark:border-white/20 dark:bg-white/15 dark:text-white">
              필터: #{tagOrganizeFilter}
            </span>
            <button
              type="button"
              onClick={onFilterClear}
              className="font-semibold text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"
            >
              필터 해제
            </button>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <input
            value={manualTagInput}
            onChange={(event) => onManualTagInputChange(event.target.value)}
            placeholder="새 태그 추가"
            className="w-full rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs text-neutral-700 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200/70 dark:border-blue-500/30 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/40 dark:focus:border-blue-300 dark:focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={onManualTagAdd}
            className="rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 whitespace-nowrap"
          >
            추가
          </button>
        </div>
        <div className="mt-3 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-1">
          <div className="flex flex-col gap-3">
            {tagsLoading && (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                태그 불러오는 중…
              </div>
            )}
            {!tagsLoading &&
              manualTagOptions.length === 0 &&
              recentTagOptions.length === 0 &&
              allTagOptions.length === 0 && (
                <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                  태그가 없습니다.
                </div>
              )}
            {!tagsLoading && manualTagOptions.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold text-neutral-500 dark:text-white/60">
                  수동 태그
                </div>
                {manualTagOptions.map((tag) => (
                  <div
                    key={tag.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => onFilterSelect(tag.name)}
                  >
                    <div
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onFilterSelect(tag.name);
                        }
                      }}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs shadow-sm transition ${
                        tagOrganizeFilter === tag.name
                          ? "border-blue-500 bg-blue-100 text-blue-800"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      } dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.name)}
                          onChange={() => onToggleSelect(tag.name)}
                          onClick={(event) => event.stopPropagation()}
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
            {!tagsLoading && recentTagOptions.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold text-neutral-500 dark:text-white/60">
                  최근 태그
                </div>
                {recentTagOptions.map((tag) => (
                  <div
                    key={tag.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => onFilterSelect(tag.name)}
                  >
                    <div
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onFilterSelect(tag.name);
                        }
                      }}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs shadow-sm transition ${
                        tagOrganizeFilter === tag.name
                          ? "border-blue-500 bg-blue-100 text-blue-800"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      } dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.name)}
                          onChange={() => onToggleSelect(tag.name)}
                          onClick={(event) => event.stopPropagation()}
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
            {!tagsLoading && allTagOptions.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold text-neutral-500 dark:text-white/60">
                  전체 태그
                </div>
                {allTagOptions.map((tag) => (
                  <div
                    key={tag.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => onFilterSelect(tag.name)}
                  >
                    <div
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onFilterSelect(tag.name);
                        }
                      }}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs shadow-sm transition ${
                        tagOrganizeFilter === tag.name
                          ? "border-blue-500 bg-blue-100 text-blue-800"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      } dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.name)}
                          onChange={() => onToggleSelect(tag.name)}
                          onClick={(event) => event.stopPropagation()}
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
