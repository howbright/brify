"use client";

import MapListItem from "@/components/maps/MapListItem";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";

type MapCardListProps = {
  drafts: MapDraft[];
  selectedId: string | null;
  previewOpen: boolean;
  selectionMode: boolean;
  tagOrganizeMode: boolean;
  compactLayout?: boolean;
  selectedMapIds: string[];
  onSelect: (draft: MapDraft) => void;
  onToggleSelect: (draft: MapDraft) => void;
  onEditTags: (draft: MapDraft) => void;
  onOpenDetail?: (draft: MapDraft) => void;
  showOpenDetail?: boolean;
};

export default function MapCardList({
  drafts,
  selectedId,
  previewOpen,
  selectionMode,
  tagOrganizeMode,
  compactLayout = false,
  selectedMapIds,
  onSelect,
  onToggleSelect,
  onEditTags,
  onOpenDetail,
  showOpenDetail = false,
}: MapCardListProps) {
  return (
    <section
      className={`mt-4 grid w-full min-w-0 gap-3 ${
        compactLayout ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"
      }`}
    >
      {drafts.map((draft) => (
        <MapListItem
          key={draft.id}
          draft={draft}
          selected={previewOpen && draft.id === selectedId}
          selectionMode={selectionMode && !tagOrganizeMode}
          checked={selectedMapIds.includes(draft.id)}
          onSelect={tagOrganizeMode ? undefined : onSelect}
          onToggleSelect={tagOrganizeMode ? undefined : onToggleSelect}
          onEditTags={onEditTags}
          showEditTags={tagOrganizeMode}
          onOpenDetail={onOpenDetail}
          showOpenDetail={showOpenDetail}
        />
      ))}
    </section>
  );
}
