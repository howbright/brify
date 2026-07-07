"use client";

import { useEffect, useRef } from "react";
import type { MapOpenAccessMode } from "@/app/lib/mapOpenEvents";

const SESSION_STORAGE_KEY = "brify_map_session_id";

function getMapSessionKey() {
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;

    const next =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return null;
  }
}

type UseMapOpenEventOptions = {
  mapId?: string | null;
  sharedToken?: string | null;
  accessMode: MapOpenAccessMode;
  locale?: string | null;
  enabled?: boolean;
};

export function useMapOpenEvent({
  mapId,
  sharedToken,
  accessMode,
  locale,
  enabled = true,
}: UseMapOpenEventOptions) {
  const sentKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (accessMode === "shared" && !sharedToken) return;
    if (accessMode !== "shared" && !mapId) return;

    const targetKey =
      accessMode === "shared"
        ? `shared:${sharedToken}:${locale ?? ""}`
        : `${accessMode}:${mapId}:${locale ?? ""}`;
    if (sentKeyRef.current === targetKey) return;
    sentKeyRef.current = targetKey;

    const sessionKey = getMapSessionKey();
    const endpoint =
      accessMode === "shared"
        ? `/api/share/${encodeURIComponent(sharedToken ?? "")}/open-event`
        : `/api/maps/${encodeURIComponent(mapId ?? "")}/open-event`;

    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessMode,
        locale,
        sessionKey,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [accessMode, enabled, locale, mapId, sharedToken]);
}
