"use client";

import { useEffect, useState, type RefObject } from "react";
import { Icon } from "@iconify/react";

type Props = {
  show: boolean;
  label: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  centerLabel: string;
  zoomInLabel: string;
  zoomOutLabel: string;
  collapseLevelLabel: string;
  moveUpLabel: string;
  onCenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCollapseLevel: () => void;
  onMoveUp: () => void;
};

export default function MindElixirMiniMap({
  show,
  label,
  canvasRef,
  centerLabel,
  zoomInLabel,
  zoomOutLabel,
  collapseLevelLabel,
  moveUpLabel,
  onCenter,
  onZoomIn,
  onZoomOut,
  onCollapseLevel,
  onMoveUp,
}: Props) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const detectTouchDevice = () => {
      const hasCoarsePointer =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(pointer: coarse)").matches;
      const hasTouchPoints =
        typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
      const touch = hasCoarsePointer || hasTouchPoints;
      setIsTouchDevice(touch);
      setCollapsed((prev) => (prev ? prev : touch));
    };

    detectTouchDevice();
    window.addEventListener("resize", detectTouchDevice);
    return () => window.removeEventListener("resize", detectTouchDevice);
  }, []);

  if (!show) return null;

  return (
    <div className="pointer-events-auto absolute bottom-6 right-4 z-20 rounded-xl border border-white/15 bg-[#0b1220] p-2 shadow-[0_16px_42px_-24px_rgba(15,23,42,0.92)]">
      <div className="flex items-center justify-start gap-1.5">
          {[
            {
              icon: "mdi:crosshairs-gps",
              label: centerLabel,
              onClick: onCenter,
            },
            {
              icon: "mdi:plus",
              label: zoomInLabel,
              onClick: onZoomIn,
            },
            {
              icon: "mdi:minus",
              label: zoomOutLabel,
              onClick: onZoomOut,
            },
            {
              icon: "mdi:arrow-up",
              label: moveUpLabel,
              onClick: onMoveUp,
            },
            {
              icon: "mdi:unfold-less-horizontal",
              label: collapseLevelLabel,
              onClick: onCollapseLevel,
            },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="group relative inline-flex h-8 w-8 items-center justify-center rounded-full text-white/92 transition-colors hover:bg-sky-400/18 hover:text-white focus:outline-none"
              aria-label={action.label}
              title={action.label}
            >
              <Icon icon={action.icon} className="h-4.5 w-4.5" />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/88 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {action.label}
              </span>
            </button>
          ))}
          {isTouchDevice ? (
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="group relative inline-flex h-8 w-8 items-center justify-center rounded-full text-white/92 transition-colors hover:bg-sky-400/18 hover:text-white focus:outline-none"
              aria-label={collapsed ? "Expand mini map" : "Collapse mini map"}
            >
              <Icon
                icon={collapsed ? "mdi:chevron-up" : "mdi:chevron-down"}
                className="h-4.5 w-4.5"
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/88 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {collapsed ? "Expand mini map" : "Collapse mini map"}
              </span>
            </button>
          ) : null}
      </div>
      {!collapsed ? (
        <canvas
          ref={canvasRef}
          className="mt-1 h-[132px] w-[176px] touch-none select-none"
        />
      ) : null}
    </div>
  );
}
