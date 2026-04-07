"use client";

type DebugPayload = Record<string, unknown>;

const STORAGE_KEY = "me_debug_enabled";
const SESSION_KEY = "me_debug_session";
const SENT_LIMIT = 250;
const DEDUPE_WINDOW_MS = 1200;

let sentCount = 0;
const lastSentAtByKey = new Map<string, number>();

function now() {
  return Date.now();
}

function getSessionId() {
  if (typeof window === "undefined") return "server";
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = `me-${Math.random().toString(36).slice(2, 8)}-${now()}`;
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

function syncFlagFromQuery() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const flag = url.searchParams.get("meDebug");
    if (flag === "1") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    if (flag === "0") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function isMindElixirDebugEnabled() {
  if (typeof window === "undefined") return false;
  syncFlagFromQuery();
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function logMindElixirDebug(event: string, payload: DebugPayload = {}) {
  if (typeof window === "undefined") return;
  if (!isMindElixirDebugEnabled()) return;
  if (sentCount >= SENT_LIMIT) return;

  const dedupeKey = `${event}:${JSON.stringify(payload)}`;
  const nowMs = now();
  const prevSentAt = lastSentAtByKey.get(dedupeKey) ?? 0;
  if (nowMs - prevSentAt < DEDUPE_WINDOW_MS) return;
  lastSentAtByKey.set(dedupeKey, nowMs);
  sentCount += 1;

  const body = {
    event,
    at: new Date(nowMs).toISOString(),
    sessionId: getSessionId(),
    href: window.location.href,
    ua: navigator.userAgent,
    payload,
  };

  const url = "/api/debug/mind-elixir";
  const raw = JSON.stringify(body);
  if (typeof navigator.sendBeacon === "function") {
    const blob = new Blob([raw], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }
  void fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw,
    keepalive: true,
    cache: "no-store",
  }).catch(() => {
    // ignore
  });
}
