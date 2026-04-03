"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";

type MapPreviewRow = Pick<
  Database["public"]["Tables"]["maps"]["Row"],
  "id" | "mind_elixir" | "mind_elixir_draft"
>;

type PreviewStatus = "idle" | "loading" | "loaded" | "missing" | "error";
type PreviewData = MapPreviewRow["mind_elixir"] | MapPreviewRow["mind_elixir_draft"] | null;

type UseMapPreviewOptions = {
  drafts: MapDraft[];
  previewOpen: boolean;
};

export default function useMapPreview({
  drafts,
  previewOpen,
}: UseMapPreviewOptions) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [previewById, setPreviewById] = useState<
    Record<string, { status: PreviewStatus; data: PreviewData }>
  >({});
  const previewByIdRef = useRef(previewById);

  useEffect(() => {
    previewByIdRef.current = previewById;
  }, [previewById]);

  useEffect(() => {
    if (drafts.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      if (mobilePreviewOpen) setMobilePreviewOpen(false);
      return;
    }
    if (!selectedId || !drafts.some((draft) => draft.id === selectedId)) {
      setSelectedId(drafts[0].id);
    }
  }, [drafts, mobilePreviewOpen, selectedId]);

  const selectedDraft = useMemo(
    () => (selectedId ? drafts.find((draft) => draft.id === selectedId) ?? null : null),
    [drafts, selectedId]
  );

  useEffect(() => {
    if (!selectedId || !previewOpen) return;
    const existing = previewByIdRef.current[selectedId];
    if (existing && existing.status !== "idle") return;

    let cancelled = false;

    (async () => {
      try {
        setPreviewById((prev) => ({
          ...prev,
          [selectedId]: { status: "loading", data: existing?.data ?? null },
        }));

        const supabase = createClient();
        const { data, error } = await supabase
          .from("maps")
          .select("id,mind_elixir,mind_elixir_draft")
          .eq("id", selectedId)
          .single<MapPreviewRow>();

        if (cancelled) return;
        if (error) throw error;

        const effectiveMind = data?.mind_elixir_draft ?? data?.mind_elixir ?? null;
        if (!effectiveMind) {
          setPreviewById((prev) => ({
            ...prev,
            [selectedId]: { status: "missing", data: null },
          }));
          return;
        }

        setPreviewById((prev) => ({
          ...prev,
          [selectedId]: { status: "loaded", data: effectiveMind },
        }));
      } catch {
        if (cancelled) return;
        setPreviewById((prev) => ({
          ...prev,
          [selectedId]: { status: "error", data: null },
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [previewOpen, selectedId]);

  const previewState = selectedId ? previewById[selectedId] : null;
  const previewStatus = selectedId ? previewState?.status ?? "loading" : "idle";
  const previewData = previewState?.data ?? null;

  const handleItemSelect = (item: MapDraft, selectionMode: boolean, onToggleSelect: (draft: MapDraft) => void) => {
    if (selectionMode) {
      onToggleSelect(item);
      return;
    }
    if (!previewOpen) {
      setSelectedId(item.id);
      return;
    }
    setSelectedId(item.id);
    setMobilePreviewOpen(true);
  };

  return {
    selectedId,
    setSelectedId,
    selectedDraft,
    previewStatus,
    previewData,
    mobilePreviewOpen,
    setMobilePreviewOpen,
    handleItemSelect,
  };
}
