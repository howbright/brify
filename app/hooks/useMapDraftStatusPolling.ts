"use client";

import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/app/types/database.types";
import { MapDraft, MapJobStatus } from "../[locale]/(main)/video-to-map/types";

type ServerDraftRow = {
  id: string;
  map_status: MapJobStatus;
};

type GenerationJobRow =
  Database["public"]["Tables"]["map_generation_jobs"]["Row"];
type GenerationChunkRow =
  Database["public"]["Tables"]["map_generation_chunks"]["Row"];

type PollingChunkStatus =
  | GenerationChunkRow["status"]
  | "retrying";

type PollingChunkRow = Pick<
  GenerationChunkRow,
  "id" | "job_id" | "chunk_index" | "chunk_count" | "error_message"
> & { status: PollingChunkStatus };

type PollingPayload = {
  maps: ServerDraftRow[];
  jobs: Pick<
    GenerationJobRow,
    "id" | "status" | "current_step" | "error_message" | "final_map_id" | "chunk_count"
  >[];
  chunks: PollingChunkRow[];
};

type Options = {
  refreshMs?: number; // default 4000
};

function isDraftActive(status: MapJobStatus) {
  return (
    status === "idle" ||
    status === "queued" ||
    status === "retrying" ||
    status === "processing_structure" ||
    status === "processing_metadata"
  );
}

function coerceChunkStatus(
  status: PollingChunkStatus
): MapJobStatus {
  if (status === "failed" || status === "cancelled") return "failed";
  if (status === "done" || status === "merged") return "done";
  if (status === "retrying") return "retrying";
  if (status === "processing") return "processing_structure";
  return "queued";
}

function coerceMergeStatus(
  status: Database["public"]["Enums"]["map_generation_job_status"]
): MapJobStatus {
  if (status === "failed" || status === "cancelled") return "failed";
  if (status === "done") return "done";
  if (status === "merging") return "processing_structure";
  return "queued";
}

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

  const mapIds = useMemo(() => {
    return Array.from(
      new Set(
        drafts
          .filter((d) => (d.kind ?? "map") === "map")
          .map((d) => d.id)
          .filter(Boolean)
      )
    ).sort();
  }, [drafts]);

  const generationJobIds = useMemo(() => {
    return Array.from(
      new Set(drafts.map((d) => d.generationJobId).filter(Boolean))
    ).sort() as string[];
  }, [drafts]);

  const hasProcessingDraft = useMemo(
    () => drafts.some((d) => isDraftActive(d.status)),
    [drafts]
  );

  const { data: pollingData } = useSWR<PollingPayload>(
    hasProcessingDraft &&
      (mapIds.length || generationJobIds.length)
      ? ["maps-status", mapIds, generationJobIds]
      : null,
    async ([, ids, jobIds]) => {
      const mapIdList = Array.isArray(ids) ? ids : [];
      const jobIdList = Array.isArray(jobIds) ? jobIds : [];

      const supabase = createClient();

      const [mapsResult, jobsResult, chunksResult] = await Promise.all([
        mapIdList.length
          ? supabase.from("maps").select("id,map_status").in("id", mapIdList)
          : Promise.resolve({ data: [], error: null }),
        jobIdList.length
          ? supabase
              .from("map_generation_jobs")
              .select("id,status,current_step,error_message,final_map_id,chunk_count")
              .in("id", jobIdList)
          : Promise.resolve({ data: [], error: null }),
        jobIdList.length
          ? supabase
              .from("map_generation_chunks")
              .select("id,job_id,chunk_index,chunk_count,status,error_message")
              .in("job_id", jobIdList)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (mapsResult.error) throw mapsResult.error;
      if (jobsResult.error) throw jobsResult.error;
      if (chunksResult.error) throw chunksResult.error;

      return {
        maps: Array.isArray(mapsResult.data)
          ? (mapsResult.data as ServerDraftRow[])
          : [],
        jobs: Array.isArray(jobsResult.data) ? jobsResult.data : [],
        chunks: Array.isArray(chunksResult.data) ? chunksResult.data : [],
      };
    },
    {
      // ✅ 서버 응답 기준으로 processing이면 계속 폴링, 아니면 중지
      refreshInterval: (latest) => {
        const payload = latest ?? { maps: [], jobs: [], chunks: [] };
        const hasActiveMap = payload.maps.some((d) => isDraftActive(d.map_status));
        const hasActiveJob = payload.jobs.some(
          (job) => job.status !== "done" && job.status !== "failed" && job.status !== "cancelled"
        );
        const hasActiveChunk = payload.chunks.some(
          (chunk) =>
            chunk.status === "queued" ||
            chunk.status === "processing" ||
            chunk.status === "retrying"
        );
        return hasActiveMap || hasActiveJob || hasActiveChunk ? refreshMs : 0;
      },
      keepPreviousData: true,
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    if (!pollingData) return;

    const mapsById = new Map(pollingData.maps.map((x) => [x.id, x]));
    const jobsById = new Map(pollingData.jobs.map((x) => [x.id, x]));
    setDrafts((prev) => {
      let changed = false;

      const next = prev.map((draft) => {
        if (draft.kind === "chunk" && draft.generationJobId) {
          const foundChunk = pollingData.chunks.find(
            (chunk) =>
              chunk.job_id === draft.generationJobId &&
              chunk.chunk_index === draft.chunkIndex
          );
          const foundJob = jobsById.get(draft.generationJobId);
          if (!foundChunk && !foundJob) return draft;

          let nextStatus = foundChunk
            ? coerceChunkStatus(foundChunk.status)
            : draft.status;
          const nextError = foundChunk?.error_message ?? draft.error;

          if (
            foundJob?.status === "processing_chunks" &&
            (nextStatus === "queued" || nextStatus === "idle")
          ) {
            nextStatus = "processing_structure";
          }
          if (
            nextStatus === draft.status &&
            nextError === draft.error
          ) {
            return draft;
          }

          changed = true;
          return {
            ...draft,
            status: nextStatus,
            error: nextError ?? undefined,
            updatedAt: Date.now(),
          };
        }

        if (draft.kind === "merge" && draft.generationJobId) {
          const foundJob = jobsById.get(draft.generationJobId);
          if (!foundJob) return draft;

          const nextStatus = coerceMergeStatus(foundJob.status);
          const nextHelperText = foundJob.current_step ?? draft.helperText;
          const nextError = foundJob.error_message ?? draft.error;
          if (
            nextStatus === draft.status &&
            nextHelperText === draft.helperText &&
            nextError === draft.error
          ) {
            return draft;
          }

          changed = true;
          return {
            ...draft,
            status: nextStatus,
            helperText: nextHelperText ?? undefined,
            error: nextError ?? undefined,
            updatedAt: Date.now(),
          };
        }

        const foundMap = mapsById.get(draft.id);
        const foundJob = draft.generationJobId
          ? jobsById.get(draft.generationJobId)
          : undefined;

        if (!foundMap && !foundJob) return draft;

        let nextStatus = draft.status;
        if (foundMap?.map_status) {
          nextStatus = foundMap.map_status;
        } else if (foundJob?.status) {
          nextStatus = coerceMergeStatus(foundJob.status);
        }

        const nextError = foundJob?.error_message ?? draft.error;
        const nextHelperText = foundJob?.current_step ?? draft.helperText;

        if (
          nextStatus === draft.status &&
          nextError === draft.error &&
          nextHelperText === draft.helperText
        ) {
          return draft;
        }

        changed = true;
        return {
          ...draft,
          status: nextStatus,
          error: nextError ?? undefined,
          helperText: nextHelperText ?? undefined,
          updatedAt: Date.now(),
        };
      });

      return changed ? next : prev;
    });
  }, [pollingData, setDrafts]);
}
