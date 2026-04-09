"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Labels = {
  addChild: string;
  addSibling: string;
  rename: string;
  remove: string;
  close: string;
};

type Params = {
  mode: "light" | "dark" | "auto";
  resolvedTheme?: string;
  locale: string;
  editMode: "view" | "edit";
  panMode?: boolean;
  showMobileEditControls: boolean;
};

export function useMindElixirResponsiveState({
  mode,
  resolvedTheme,
  locale,
  editMode,
  panMode,
  showMobileEditControls,
}: Params) {
  const [mounted, setMounted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const debugRunIdRef = useRef(`responsive-${Date.now()}`);
  const debugEndpointBlockedRef = useRef(false);

  const postAgentLog = (payload: Record<string, unknown>) => {
    const mergedPayload = {
      sessionId: "bde55e",
      ...payload,
    };
    if (typeof window !== "undefined") {
      const bag = (
        window as typeof window & { __ME_DEBUG_EVENTS?: Array<Record<string, unknown>> }
      ).__ME_DEBUG_EVENTS;
      if (Array.isArray(bag)) {
        bag.push(mergedPayload);
      } else {
        (
          window as typeof window & {
            __ME_DEBUG_EVENTS?: Array<Record<string, unknown>>;
          }
        ).__ME_DEBUG_EVENTS = [mergedPayload];
      }
    }
    if (debugEndpointBlockedRef.current) {
      console.warn("[ME_DEBUG]", mergedPayload);
      return;
    }
    fetch("http://127.0.0.1:7600/ingest/7bd65ea4-78f4-422e-b8b9-6e9c6e260f2e", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "bde55e",
      },
      body: JSON.stringify(mergedPayload),
    }).catch((error) => {
      debugEndpointBlockedRef.current = true;
      console.warn("[ME_DEBUG_BLOCKED]", {
        ...mergedPayload,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    });
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const detectTouchDevice = () => {
      const hasCoarsePointer =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(pointer: coarse)").matches;
      const hasTouchPoints =
        typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
      const detected = hasCoarsePointer || hasTouchPoints;
      // #region agent log
      postAgentLog({
        runId: debugRunIdRef.current,
        hypothesisId: "H13",
        location: "components/useMindElixirResponsiveState.ts:detectTouchDevice",
        message: "touch capability detection",
        data: {
          hasCoarsePointer,
          hasTouchPoints,
          maxTouchPoints:
            typeof navigator !== "undefined" ? navigator.maxTouchPoints : null,
          innerWidth: typeof window !== "undefined" ? window.innerWidth : null,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
          detected,
        },
        timestamp: Date.now(),
      });
      // #endregion
      setIsTouchDevice(detected);
    };

    detectTouchDevice();
    window.addEventListener("resize", detectTouchDevice);
    return () => window.removeEventListener("resize", detectTouchDevice);
  }, [mounted]);

  const isPanModeControlled = typeof panMode === "boolean";

  const effectiveMode = useMemo<"light" | "dark">(() => {
    if (mode === "light" || mode === "dark") return mode;
    if (!mounted) return "light";
    return resolvedTheme === "dark" ? "dark" : "light";
  }, [mode, resolvedTheme, mounted]);

  const effectivePanMode = isTouchDevice ? false : (panMode ?? false);
  const showMobileControls =
    showMobileEditControls && isTouchDevice && editMode === "edit";

  useEffect(() => {
    // #region agent log
    postAgentLog({
      runId: debugRunIdRef.current,
      hypothesisId: "H14",
      location: "components/useMindElixirResponsiveState.ts:showMobileControls",
      message: "showMobileControls computed",
      data: {
        showMobileEditControls,
        isTouchDevice,
        editMode,
        showMobileControls,
      },
      timestamp: Date.now(),
    });
    // #endregion
  }, [editMode, isTouchDevice, showMobileControls, showMobileEditControls]);

  const mobileEditLabels: Labels =
    locale === "ko"
        ? {
            addChild: "자식 추가",
            addSibling: "형제 추가",
            rename: "이름 수정",
            remove: "삭제",
            close: "닫기",
          }
        : {
            addChild: "Add child",
            addSibling: "Add sibling",
            rename: "Rename",
            remove: "Delete",
            close: "Close",
          };

  return {
    mounted,
    isTouchDevice,
    effectiveMode,
    isPanModeControlled,
    effectivePanMode,
    showMobileControls,
    mobileEditLabels,
  };
}
