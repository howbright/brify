"use client";

import { useEffect, useMemo, useState } from "react";

type Labels = {
  pan: string;
  select: string;
  addChild: string;
  addSibling: string;
  rename: string;
  remove: string;
};

type Params = {
  mode: "light" | "dark" | "auto";
  resolvedTheme?: string;
  locale: string;
  editMode: "view" | "edit";
  panMode?: boolean;
  preferPanModeOnTouch: boolean;
  showMobileEditControls: boolean;
};

export function useMindElixirResponsiveState({
  mode,
  resolvedTheme,
  locale,
  editMode,
  panMode,
  preferPanModeOnTouch,
  showMobileEditControls,
}: Params) {
  const [mounted, setMounted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [mobilePanMode, setMobilePanMode] = useState<boolean | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const detectTouchDevice = () => {
      const hasCoarsePointer =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(pointer: coarse)").matches;
      const hasTouchPoints =
        typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasCoarsePointer || hasTouchPoints);
    };

    detectTouchDevice();
    window.addEventListener("resize", detectTouchDevice);
    return () => window.removeEventListener("resize", detectTouchDevice);
  }, [mounted]);

  const isPanModeControlled = typeof panMode === "boolean";

  useEffect(() => {
    if (isPanModeControlled) {
      setMobilePanMode(null);
      return;
    }
    if (preferPanModeOnTouch && isTouchDevice) {
      setMobilePanMode((prev) => prev ?? true);
    }
  }, [isPanModeControlled, preferPanModeOnTouch, isTouchDevice]);

  const effectiveMode = useMemo<"light" | "dark">(() => {
    if (mode === "light" || mode === "dark") return mode;
    if (!mounted) return "light";
    return resolvedTheme === "dark" ? "dark" : "light";
  }, [mode, resolvedTheme, mounted]);

  const effectivePanMode =
    panMode ?? mobilePanMode ?? (preferPanModeOnTouch && isTouchDevice);
  const showMobileControls =
    showMobileEditControls && isTouchDevice && editMode === "edit";
  const showInternalMobileModeToggle =
    showMobileControls && !isPanModeControlled;

  const mobileEditLabels: Labels =
    locale === "ko"
      ? {
          pan: "이동",
          select: "선택",
          addChild: "자식 추가",
          addSibling: "형제 추가",
          rename: "이름 수정",
          remove: "삭제",
        }
      : {
          pan: "Pan",
          select: "Select",
          addChild: "Add child",
          addSibling: "Add sibling",
          rename: "Rename",
          remove: "Delete",
        };

  return {
    mounted,
    isTouchDevice,
    effectiveMode,
    isPanModeControlled,
    effectivePanMode,
    showMobileControls,
    showInternalMobileModeToggle,
    mobileEditLabels,
    setMobilePanMode,
  };
}
