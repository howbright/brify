"use client";

import { useTranslations } from "next-intl";

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
  const t = useTranslations("MapsCommon.selectionBar");

  return (
    <div className="sticky top-0 z-10 mt-1 w-full rounded-[18px] border border-neutral-600 bg-neutral-700 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-md md:rounded-2xl md:px-3 md:py-1.5 md:text-[10px]">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span>{t("selectedCount", { count: selectedCount })}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenMerge}
            disabled={selectedCount < 2}
            className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 hover:bg-white/15 disabled:opacity-40"
          >
            {t("mergeMaps")}
          </button>
          <button
            type="button"
            onClick={onOpenBulkDelete}
            disabled={selectedCount === 0 || bulkDeleting}
            className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 hover:bg-white/15 disabled:opacity-40"
          >
            {bulkDeleting ? t("deleting") : t("deleteSelected")}
          </button>
          <button
            type="button"
            onClick={onCancelSelection}
            className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 hover:bg-white/15"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
