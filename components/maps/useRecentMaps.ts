"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];

type UseRecentMapsOptions = {
  locale?: string;
  listFields: string;
  toDraft: (row: MapRow) => MapDraft;
};

export default function useRecentMaps({
  locale,
  listFields,
  toDraft,
}: UseRecentMapsOptions) {
  const [recentCreatedDrafts, setRecentCreatedDrafts] = useState<MapDraft[]>([]);
  const [recentUpdatedDrafts, setRecentUpdatedDrafts] = useState<MapDraft[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();

        const [
          { data: createdData, error: createdError },
          { data: updatedData, error: updatedError },
        ] = await Promise.all([
          supabase
            .from("maps")
            .select(listFields)
            .order("created_at", { ascending: false })
            .range(0, 4),
          supabase
            .from("maps")
            .select(listFields)
            .order("updated_at", { ascending: false, nullsFirst: false })
            .range(0, 4),
        ]);

        if (cancelled) return;
        if (createdError) throw createdError;
        if (updatedError) throw updatedError;

        setRecentCreatedDrafts(((createdData ?? []) as MapRow[]).map(toDraft));
        setRecentUpdatedDrafts(((updatedData ?? []) as MapRow[]).map(toDraft));
      } catch {
        if (cancelled) return;
        setRecentCreatedDrafts([]);
        setRecentUpdatedDrafts([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listFields, toDraft]);

  const recentDrafts = useMemo(() => {
    const byId = new Map<string, MapDraft>();
    [...recentUpdatedDrafts, ...recentCreatedDrafts].forEach((draft) => {
      const existing = byId.get(draft.id);
      if (!existing) {
        byId.set(draft.id, draft);
        return;
      }
      const existingTs = existing.updatedAt ?? existing.createdAt ?? 0;
      const nextTs = draft.updatedAt ?? draft.createdAt ?? 0;
      if (nextTs > existingTs) {
        byId.set(draft.id, draft);
      }
    });

    return Array.from(byId.values())
      .sort((a, b) => {
        const aTs = a.updatedAt ?? a.createdAt ?? 0;
        const bTs = b.updatedAt ?? b.createdAt ?? 0;
        return bTs - aTs;
      })
      .slice(0, 5);
  }, [recentCreatedDrafts, recentUpdatedDrafts]);

  const recentInterestTags = useMemo(() => {
    const counts = new Map<string, number>();
    const seenMapIds = new Set<string>();

    recentDrafts.forEach((draft) => {
      if (seenMapIds.has(draft.id)) return;
      seenMapIds.add(draft.id);

      (draft.tags ?? []).forEach((tag) => {
        const normalized = tag.trim();
        if (!normalized) return;
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0], locale ?? "en");
      })
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [recentDrafts, locale]);

  return {
    recentDrafts,
    recentInterestTags,
  };
}
