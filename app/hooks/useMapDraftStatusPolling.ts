"use client";

import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { MapDraft, MapJobStatus } from "../[locale]/(main)/video-to-map/types";

type ServerDraftRow = {
  id: string;
  map_status: MapJobStatus;
};

type Options = {
  refreshMs?: number; // default 4000
};

/**
 * ✅ Draft 리스트에서 processing이 하나라도 있을 때만
 * Supabase에서 해당 ids의 최신 상태를 폴링으로 가져와 drafts에 merge.
 *
 * - 카드 단위 X (부모 1곳에서만)
 * - ids 중복 제거 + 정렬로 SWR key 안정화
 * - serverDrafts -> Map으로 바꿔 O(n^2) 제거
 */
export function useMapDraftStatusPolling(
  drafts: MapDraft[],
  setDrafts: React.Dispatch<React.SetStateAction<MapDraft[]>>,
  options?: Options
) {
  const refreshMs = options?.refreshMs ?? 4000;

  const draftIds = useMemo(() => {
    return Array.from(new Set(drafts.map((d) => d.id).filter(Boolean))).sort();
  }, [drafts]);

  const hasProcessingDraft = useMemo(
    () => drafts.some((d) => d.status === "processing"),
    [drafts]
  );

  const { data: serverDrafts } = useSWR<ServerDraftRow[]>(
    hasProcessingDraft && draftIds.length ? ["maps-status", draftIds] : null,
    async ([, ids]) => {
      const idsParam = Array.isArray(ids) ? ids : [];
      if (!idsParam.length) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("maps")
        .select("id,map_status")
        .in("id", idsParam);

      if (error) throw error;
      return Array.isArray(data) ? (data as ServerDraftRow[]) : [];
    },
    {
      // ✅ 서버 응답 기준으로 processing이면 계속 폴링, 아니면 중지
      refreshInterval: (latest) => {
        const list = latest ?? [];
        const hasProcessing = list.some((d) => d.map_status === "processing");
        return hasProcessing ? refreshMs : 0;
      },
      keepPreviousData: true,
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    if (!serverDrafts || serverDrafts.length === 0) return;

    const byId = new Map(serverDrafts.map((x) => [x.id, x]));

    setDrafts((prev) => {
      let changed = false;

      const next = prev.map((draft) => {
        const found = byId.get(draft.id);
        if (!found) return draft;

        const nextStatus = (found.map_status ?? draft.status) as MapJobStatus;
        const changedThis = nextStatus !== draft.status;

        if (!changedThis) return draft;

        changed = true;
        return {
          ...draft,
          status: nextStatus,
        };
      });

      return changed ? next : prev;
    });
  }, [serverDrafts, setDrafts]);
}
