// hooks/useAutoSave.ts
"use client";

import { useCallback, useRef, useState } from "react";

type SavePayload = { nodes: any; edges: any };

export function useAutoSave(summaryId: string, delay = 250) {
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<number | null>(null);
  const lastPayloadRef = useRef<SavePayload | null>(null);

  const runSave = useCallback(async (payload: SavePayload) => {
    setIsSaving(true);
    try {
      await fetch(`/api/summaries/${summaryId}/temp-diagram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } finally {
      setIsSaving(false);
    }
  }, [summaryId]);

  const save = useCallback(async (nodesArg: any, edgesArg: any, options?: { immediate?: boolean }) => {
    const payload = { nodes: nodesArg, edges: edgesArg };
    lastPayloadRef.current = payload;

    // 즉시 저장 옵션 또는 delay 0 → 바로 저장
    if (options?.immediate || delay <= 0) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      await runSave(payload);
      return;
    }

    // 디바운스 저장
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (lastPayloadRef.current) runSave(lastPayloadRef.current);
      timerRef.current = null;
    }, delay) as unknown as number;
  }, [delay, runSave]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (lastPayloadRef.current) {
      await runSave(lastPayloadRef.current);
    }
  }, [runSave]);

  return { isSaving, save, flush };
}
