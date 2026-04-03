"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";

type UseMapSelectionMergeOptions = {
  drafts: MapDraft[];
  onMerged?: (mergedId: string) => void;
};

export default function useMapSelectionMerge({
  drafts,
  onMerged,
}: UseMapSelectionMergeOptions) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeRootTitle, setMergeRootTitle] = useState("");
  const [mergeOrderIds, setMergeOrderIds] = useState<string[]>([]);
  const [mergeSubmitting, setMergeSubmitting] = useState(false);

  const clearSelection = () => {
    setSelectionMode(false);
    setSelectedMapIds([]);
  };

  const toggleSelectedMap = (draft: MapDraft) => {
    setSelectedMapIds((prev) =>
      prev.includes(draft.id)
        ? prev.filter((id) => id !== draft.id)
        : [...prev, draft.id]
    );
  };

  useEffect(() => {
    if (!mergeDialogOpen) return;
    setMergeOrderIds(selectedMapIds);
  }, [mergeDialogOpen, selectedMapIds]);

  const selectedDrafts = useMemo(
    () =>
      selectedMapIds
        .map((id) => drafts.find((draft) => draft.id === id))
        .filter((draft): draft is MapDraft => Boolean(draft)),
    [drafts, selectedMapIds]
  );

  const mergeOrderDrafts = useMemo(
    () =>
      mergeOrderIds
        .map((id) => selectedDrafts.find((draft) => draft.id === id))
        .filter((draft): draft is MapDraft => Boolean(draft)),
    [mergeOrderIds, selectedDrafts]
  );

  const mergeReady =
    mergeRootTitle.trim().length > 0 && mergeOrderDrafts.length >= 2;

  const handleMergeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setMergeOrderIds((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleMergeSubmit = async () => {
    if (!mergeReady || mergeSubmitting) return;
    try {
      setMergeSubmitting(true);
      const res = await fetch("/api/maps/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rootTitle: mergeRootTitle.trim(),
          orderedMapIds: mergeOrderIds,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "merge_failed");
      }
      toast.success("맵을 합쳤어요.");
      setMergeDialogOpen(false);
      clearSelection();
      setMergeRootTitle("");
      if (json?.id && onMerged) {
        onMerged(json.id);
      }
    } catch {
      toast.error("맵 합치기에 실패했어요.");
    } finally {
      setMergeSubmitting(false);
    }
  };

  return {
    selectionMode,
    setSelectionMode,
    selectedMapIds,
    selectedDrafts,
    clearSelection,
    toggleSelectedMap,
    mergeDialogOpen,
    setMergeDialogOpen,
    mergeRootTitle,
    setMergeRootTitle,
    mergeOrderIds,
    setMergeOrderIds,
    mergeOrderDrafts,
    mergeSubmitting,
    mergeReady,
    handleMergeDragEnd,
    handleMergeSubmit,
  };
}
