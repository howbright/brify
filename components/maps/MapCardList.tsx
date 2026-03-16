"use client";

import MapListItem from "@/components/maps/MapListItem";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";

type MapCardListProps = {
  drafts: MapDraft[];
  selectedId: string | null;
  previewOpen: boolean;
  selectionMode: boolean;
  tagOrganizeMode: boolean;
  selectedMapIds: string[];
  onSelect: (draft: MapDraft) => void;
  onToggleSelect: (draft: MapDraft) => void;
  onEditTags: (draft: MapDraft) => void;
};

export default function MapCardList({
  drafts,
  selectedId,
  previewOpen,
  selectionMode,
  tagOrganizeMode,
  selectedMapIds,
  onSelect,
  onToggleSelect,
  onEditTags,
}: MapCardListProps) {
  return (
    <section className="mt-4 grid gap-2 w-full min-w-0">
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
        />
      ))}
    </section>
  );
}
