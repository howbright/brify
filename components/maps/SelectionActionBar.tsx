"use client";

type SelectionActionBarProps = {
  selectedCount: number;
  onOpenMerge: () => void;
  onOpenBulkDelete: () => void;
  onCancelSelection: () => void;
  bulkDeleting: boolean;
};

export default function SelectionActionBar({
  selectedCount,
  onOpenMerge,
  onOpenBulkDelete,
  onCancelSelection,
  bulkDeleting,
}: SelectionActionBarProps) {
  return (
    <div className="sticky top-0 z-10 mt-1 w-full rounded-2xl border border-neutral-600 bg-neutral-700 px-3 py-2 text-xs font-semibold text-white shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>{selectedCount}개 선택됨</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMerge}
            disabled={selectedCount < 2}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 hover:bg-white/15 disabled:opacity-40"
          >
            맵 합치기
          </button>
          <button
            type="button"
            onClick={onOpenBulkDelete}
            disabled={selectedCount === 0 || bulkDeleting}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 hover:bg-white/15 disabled:opacity-40"
          >
            {bulkDeleting ? "삭제 중..." : "선택 삭제"}
          </button>
          <button
            type="button"
            onClick={onCancelSelection}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 hover:bg-white/15"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
