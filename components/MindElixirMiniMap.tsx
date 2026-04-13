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
  expandLevelLabel: string;
  onCenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCollapseLevel: () => void;
  onExpandLevel: () => void;
};

export default function MindElixirMiniMap({
  show,
  label,
  canvasRef,
  centerLabel,
  zoomInLabel,
  zoomOutLabel,
  collapseLevelLabel,
  expandLevelLabel,
  onCenter,
  onZoomIn,
  onZoomOut,
  onCollapseLevel,
  onExpandLevel,
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
      <div className="flex items-center justify-start gap-1">
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
              icon: "mdi:unfold-more-horizontal",
              label: expandLevelLabel,
              onClick: onExpandLevel,
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
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/72 hover:bg-white/10 hover:text-white"
              aria-label={action.label}
              title={action.label}
            >
              <Icon icon={action.icon} className="h-4 w-4" />
            </button>
          ))}
          {isTouchDevice ? (
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/72 hover:bg-white/10 hover:text-white"
              aria-label={collapsed ? "Expand mini map" : "Collapse mini map"}
            >
              <Icon
                icon={collapsed ? "mdi:chevron-up" : "mdi:chevron-down"}
                className="h-4 w-4"
              />
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
