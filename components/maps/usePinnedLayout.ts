"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";

type PinnedMetrics = {
  left: number;
  width: number;
  height: number;
};

type UsePinnedPanelOptions = {
  shellRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  topOffset: number;
  bottomGap?: number;
  refreshKey?: string | number | boolean | null;
};

type UsePinnedToolbarOptions = {
  sectionRef: RefObject<HTMLElement | null>;
  shellRef: RefObject<HTMLDivElement | null>;
  innerRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  threshold: number;
  refreshKey?: string | number | boolean | null;
};

const DEFAULT_METRICS: PinnedMetrics = {
  left: 0,
  width: 0,
  height: 0,
};

export function usePinnedPanel({
  shellRef,
  enabled,
  topOffset,
  bottomGap = 24,
  refreshKey = null,
}: UsePinnedPanelOptions) {
  const [pinned, setPinned] = useState(false);
  const [metrics, setMetrics] = useState<PinnedMetrics>(DEFAULT_METRICS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) {
      setPinned(false);
      return;
    }

    const updatePosition = () => {
      const shellEl = shellRef.current;
      if (!shellEl) return;
      const rect = shellEl.getBoundingClientRect();
      const panelHeight = Math.max(320, window.innerHeight - topOffset - bottomGap);
      const shouldPin = rect.bottom > topOffset + panelHeight;

      setPinned(shouldPin);
      setMetrics({
        left: rect.left,
        width: rect.width,
        height: panelHeight,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [shellRef, enabled, topOffset, bottomGap, refreshKey]);

  return { pinned, metrics };
}

export function usePinnedToolbar({
  sectionRef,
  shellRef,
  innerRef,
  enabled,
  threshold,
  refreshKey = null,
}: UsePinnedToolbarOptions) {
  const [pinned, setPinned] = useState(false);
  const [metrics, setMetrics] = useState<PinnedMetrics>(DEFAULT_METRICS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) {
      setPinned(false);
      return;
    }

    const updatePosition = () => {
      const sectionEl = sectionRef.current;
      const shellEl = shellRef.current;
      const innerEl = innerRef.current;
      if (!sectionEl || !shellEl || !innerEl) return;

      const sectionRect = sectionEl.getBoundingClientRect();
      const shellRect = shellEl.getBoundingClientRect();
      const height = innerEl.offsetHeight;
      const shouldPin =
        sectionRect.top <= threshold &&
        sectionRect.bottom > threshold + height + 12;

      setPinned(shouldPin);
      setMetrics({
        left: shellRect.left,
        width: shellRect.width,
        height,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [sectionRef, shellRef, innerRef, enabled, threshold, refreshKey]);

  return { pinned, metrics };
}
