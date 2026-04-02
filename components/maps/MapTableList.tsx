"use client";

import { Icon } from "@iconify/react";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";

type SourceType = "youtube" | "website" | "file" | "manual";

type MapTableListProps = {
  drafts: MapDraft[];
  selectedId: string | null;
  previewOpen: boolean;
  selectionMode: boolean;
  tagOrganizeMode: boolean;
  selectedMapIds: string[];
  onSelect: (draft: MapDraft) => void;
  onToggleSelect: (draft: MapDraft) => void;
  onEditTags: (draft: MapDraft) => void;
  onOpenDetail?: (draft: MapDraft) => void;
  showEditTags: boolean;
  showOpenDetail?: boolean;
  statusLabels: Record<MapJobStatus, string>;
  sourceLabels: Record<SourceType, string>;
};

function getDisplayTitle(draft: MapDraft) {
  const baseTitle = draft.shortTitle?.trim() || draft.title;
  const channel = draft.channelName?.trim();
  return channel ? `${baseTitle} [${channel}]` : baseTitle;
}

export default function MapTableList({
  drafts,
  selectedId,
  previewOpen,
  selectionMode,
  tagOrganizeMode,
  selectedMapIds,
  onSelect,
  onToggleSelect,
  onEditTags,
  onOpenDetail,
  showEditTags,
  showOpenDetail = false,
  statusLabels,
  sourceLabels,
}: MapTableListProps) {
  return (
    <div className="mt-4 w-full min-w-0 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1220]/70">
      <table className="min-w-[760px] w-full table-fixed text-left text-[13px] [table-layout:fixed]">
        <colgroup>
          {selectionMode && !tagOrganizeMode && <col style={{ width: "24px" }} />}
          <col style={{ width: "240px" }} />
          <col style={{ width: "64px" }} />
          <col style={{ width: "64px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "110px" }} />
          <col style={{ width: "110px" }} />
        </colgroup>
        <thead className="text-[12px] font-semibold text-neutral-700 dark:text-white/75">
          <tr className="border-b border-neutral-300 bg-neutral-50/80 dark:border-white/15 dark:bg-white/[0.04]">
            {selectionMode && !tagOrganizeMode && (
              <th className="w-6 min-w-[24px] max-w-[24px] px-[3px] py-1.5 border-r border-neutral-200 dark:border-white/10 text-center">
                <span className="sr-only">선택</span>
              </th>
            )}
            <th className="px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">
              제목
            </th>
            <th className="w-[64px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">
              상태
            </th>
            <th className="w-[64px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">
              소스
            </th>
            <th className="w-[120px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">
              태그
            </th>
            <th className="w-[110px] px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">
              생성일
            </th>
            <th className="w-[110px] px-2 py-1.5">수정일</th>
          </tr>
        </thead>
        <tbody>
          {drafts.map((draft) => {
            const isSelected = previewOpen && draft.id === selectedId;
            const displayTitle = getDisplayTitle(draft);
            const tags = draft.tags ?? [];
            const visibleTags = tags.slice(0, 2);
            const remainingTags = tags.length - visibleTags.length;
            return (
              <tr
                key={draft.id}
                className={`border-b border-neutral-200 hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/[0.05] ${
                  isSelected ? "bg-blue-50/60 dark:bg-blue-500/10" : ""
                }`}
                onClick={() => {
                  if (tagOrganizeMode) return;
                  onSelect(draft);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (tagOrganizeMode) return;
                    onSelect(draft);
                  }
                }}
              >
                {selectionMode && !tagOrganizeMode && (
                  <td className="w-6 min-w-[24px] max-w-[24px] px-[3px] py-1.5 border-r border-neutral-200 dark:border-white/10 text-center">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedMapIds.includes(draft.id)}
                        onChange={() => onToggleSelect(draft)}
                        onClick={(event) => event.stopPropagation()}
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
                        aria-label={`${displayTitle} 선택`}
                      />
                    </div>
                  </td>
                )}
                <td className="px-2 py-1.5 border-r border-neutral-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1 text-[14px] font-medium text-neutral-800 dark:text-white/85 truncate">
                      {displayTitle}
                    </div>
                    {showOpenDetail && onOpenDetail && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenDetail(draft);
                          }}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 hover:shadow-sm cursor-pointer dark:border-white/15 dark:bg-white/[0.06] dark:text-white/80 dark:hover:border-white/40 dark:hover:bg-white/10"
                        >
                          <Icon icon="mdi:open-in-new" className="h-3.5 w-3.5" />
                          열기
                        </button>
                    )}
                  </div>
                </td>
                <td className="w-[64px] px-2 py-1.5 text-[13px] text-neutral-700 dark:text-white/75 border-r border-neutral-200 dark:border-white/10">
                  {statusLabels[draft.status] ?? "-"}
                </td>
                <td className="w-[64px] px-2 py-1.5 text-[13px] text-neutral-700 dark:text-white/75 border-r border-neutral-200 dark:border-white/10">
                  {draft.sourceType ? sourceLabels[draft.sourceType] : "-"}
                </td>
                <td className="w-[120px] px-2 py-1.5 text-neutral-600 dark:text-white/70 border-r border-neutral-200 dark:border-white/10">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-h-[36px] flex-1 text-[12px] leading-5 text-neutral-700 dark:text-white/75 line-clamp-2">
                      {visibleTags.length > 0
                        ? `${visibleTags.map((tag) => `#${tag}`).join(" ")}${
                            remainingTags > 0 ? ` +${remainingTags}` : ""
                          }`
                        : "-"}
                    </span>
                      {showEditTags && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditTags(draft);
                          }}
                          className="inline-flex items-center gap-1 self-center rounded-full border border-blue-500/70 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25"
                        >
                          <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                          편집
                        </button>
                    )}
                  </div>
                </td>
                <td className="w-[110px] px-2 py-1.5 text-[12px] font-medium text-neutral-600 dark:text-white/70 border-r border-neutral-200 dark:border-white/10 whitespace-nowrap">
                  {new Date(draft.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </td>
                <td className="w-[110px] px-2 py-1.5 text-[12px] font-medium text-neutral-600 dark:text-white/70 whitespace-nowrap">
                  {draft.updatedAt
                    ? new Date(draft.updatedAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
