"use client";

import { Icon } from "@iconify/react";
import TagPanel from "@/components/maps/TagPanel";

type TagOption = {
  name: string;
  count: number;
};

type MobileTagSheetProps = {
  open: boolean;
  tagOrganizeMode: boolean;
  tagListQuery: string;
  onTagListQueryChange: (value: string) => void;
  tagsLoading: boolean;
  tagOptions: TagOption[];
  tagSort: "recent" | "name" | "count_desc" | "count_asc";
  onTagSortChange: (value: "recent" | "name" | "count_desc" | "count_asc") => void;
  selectedTags: string[];
  onToggleSelect: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
  onOpenMerge: () => void;
  onCloseSheet: () => void;
  onReopen: () => void;
};

export default function MobileTagSheet({
  open,
  tagOrganizeMode,
  tagListQuery,
  onTagListQueryChange,
  tagsLoading,
  tagOptions,
  tagSort,
  onTagSortChange,
  selectedTags,
  onToggleSelect,
  onDeleteTag,
  onOpenMerge,
  onCloseSheet,
  onReopen,
}: MobileTagSheetProps) {
  return (
    <>
      {open && (
        <div className="lg:hidden">
          <div
            className={`fixed inset-0 z-40 bg-black/25 transition-opacity ${
              open ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={onCloseSheet}
          />
          <div
            className={`fixed inset-x-0 bottom-0 z-50 max-h-[82vh] transform transition-transform ${
              open ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto w-full max-w-2xl px-4 pb-4 pt-3">
              <div className="rounded-[28px] bg-white shadow-2xl dark:bg-[#0b1220]">
                <div className="mx-auto mb-3 mt-2 h-1.5 w-10 rounded-full bg-neutral-300/70 dark:bg-white/20" />
                <TagPanel
                  tagListQuery={tagListQuery}
                  onTagListQueryChange={onTagListQueryChange}
                  tagsLoading={tagsLoading}
                  tagOptions={tagOptions}
                  tagSort={tagSort}
                  onTagSortChange={onTagSortChange}
                  onDeleteTag={onDeleteTag}
                  selectedTags={selectedTags}
                  onToggleSelect={onToggleSelect}
                  onOpenMerge={onOpenMerge}
                  containerClassName="block"
                  panelClassName="rounded-[28px] border-0 bg-transparent px-4 pb-4 pt-0 shadow-none"
                  listClassName="mt-3 max-h-[56vh] overflow-y-auto overflow-x-hidden pr-1"
                  headerAccessory={
                    <button
                      type="button"
                      onClick={onCloseSheet}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/80"
                      aria-label="태그 정리 닫기"
                    >
                      ×
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {!open && tagOrganizeMode && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 lg:hidden">
          <div className="relative inline-flex">
            <span className="pointer-events-none absolute inset-[-8px] rounded-full border-4 border-cyan-300/80 shadow-[0_0_0_8px_rgba(34,211,238,0.18)] dark:border-cyan-200/65 dark:shadow-[0_0_0_8px_rgba(34,211,238,0.14)]" />
            <span className="pointer-events-none absolute inset-[-8px] animate-ping rounded-full border-4 border-cyan-200/70 [animation-duration:2.2s] dark:border-cyan-100/55" />
            <span className="pointer-events-none absolute inset-[-15px] rounded-full border-2 border-blue-400/35 dark:border-blue-300/25" />
            <button
              type="button"
              onClick={onReopen}
              className="relative z-[1] inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-[linear-gradient(135deg,#22d3ee,#2563eb)] px-5 py-3 text-sm font-extrabold tracking-[-0.01em] text-white shadow-[0_18px_36px_-18px_rgba(37,99,235,0.65)] transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] dark:border-cyan-200/50 dark:bg-[linear-gradient(135deg,rgba(34,211,238,0.95),rgba(59,130,246,0.95))] dark:text-white"
            >
              <Icon icon="mdi:tag-outline" className="h-4.5 w-4.5" />
              태그 목록
            </button>
          </div>
        </div>
      )}
    </>
  );
}
