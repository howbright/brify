"use client";

import { useMemo } from "react";

export const DARK_CANVAS_CLASS = "me-dark-canvas";
export const DEFAULT_DARK_CANVAS_CLASS = "me-default-dark-canvas";

type Params = {
  mounted: boolean;
  effectiveMode: "light" | "dark";
  hasFixedTheme: boolean;
  panModeClass: string;
  viewModeClass: string;
};

export function useMindElixirThemeStyles({
  mounted,
  effectiveMode,
  hasFixedTheme,
  panModeClass,
  viewModeClass,
}: Params) {
  const isDarkCanvas = mounted && effectiveMode === "dark";

  const wrapperClassName = useMemo(() => {
    const classes = ["relative", "h-full", "w-full"];
    if (isDarkCanvas) classes.push(DARK_CANVAS_CLASS);
    if (isDarkCanvas && !hasFixedTheme) {
      classes.push(DEFAULT_DARK_CANVAS_CLASS);
    }
    return classes.join(" ");
  }, [hasFixedTheme, isDarkCanvas]);

  const globalStyles = useMemo(
    () => `
      .${panModeClass} me-tpc,
      .${panModeClass} [data-nodeid],
      .${panModeClass} .node,
      .${panModeClass} .node-box,
      .${panModeClass} .topic {
        pointer-events: none;
      }
      .${viewModeClass} .context-menu .menu-list #cm-add_child,
      .${viewModeClass} .context-menu .menu-list #cm-add_parent,
      .${viewModeClass} .context-menu .menu-list #cm-add_sibling,
      .${viewModeClass} .context-menu .menu-list #cm-remove_child,
      .${viewModeClass} .context-menu .menu-list #cm-up,
      .${viewModeClass} .context-menu .menu-list #cm-down,
      .${viewModeClass} .context-menu .menu-list #cm-link,
      .${viewModeClass} .context-menu .menu-list #cm-link-bidirectional,
      .${viewModeClass} .context-menu .menu-list #cm-summary {
        display: none;
      }
      me-tpc {
        position: relative;
        overflow: visible;
      }
      .${DEFAULT_DARK_CANVAS_CLASS} me-tpc {
        border: 1.5px solid rgba(255, 255, 255, 0.84) !important;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
      }
      .${DEFAULT_DARK_CANVAS_CLASS} me-root me-tpc,
      .${DEFAULT_DARK_CANVAS_CLASS} me-tpc.root {
        border-color: rgba(255, 255, 255, 0.97) !important;
      }
      me-root me-tpc,
      me-tpc.root {
        max-width: 12.5em !important;
      }
      me-root me-tpc .text,
      me-tpc.root .text,
      me-root me-tpc .topic,
      me-tpc.root .topic {
        display: block;
        max-width: 12.5em !important;
        font-size: 1rem !important;
        line-height: 1.3 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
        text-wrap: wrap !important;
      }
      @media (max-width: 639px) {
        me-parent me-tpc:not(.root) {
          max-width: 21em !important;
        }
        me-parent me-tpc:not(.root) .text,
        me-parent me-tpc:not(.root) .topic {
          display: block;
          max-width: 21em !important;
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
          text-wrap: wrap !important;
        }
        #input-box {
          box-sizing: border-box !important;
          width: auto !important;
          max-width: 21em !important;
          min-width: min(21em, calc(100vw - 40px)) !important;
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
          text-wrap: wrap !important;
          line-height: 1.4 !important;
        }
      }
      .me-note-dot {
        position: absolute;
        right: -6px;
        top: -6px;
        width: 16px;
        height: 16px;
        border-radius: 999px;
        background: #2563eb;
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow:
          0 0 0 2px rgba(255, 255, 255, 0.95),
          0 6px 12px rgba(37, 99, 235, 0.35);
        cursor: pointer;
        pointer-events: auto;
      }
      .me-note-dot svg,
      .me-note-dot svg * {
        width: 10px;
        height: 10px;
        pointer-events: none;
      }
      .${viewModeClass} .me-note-dot {
        cursor: pointer;
      }
      me-tpc[data-highlight="gold"] {
        background-color: #fde68a !important;
        color: #7c2d12 !important;
        border: 1px solid #f59e0b !important;
        box-shadow:
          0 6px 16px rgba(245, 158, 11, 0.35),
          0 0 0 2px rgba(253, 230, 138, 0.5);
      }
      me-tpc[data-highlight="gold"] .text {
        color: #7c2d12 !important;
        font-weight: 600;
      }
      me-tpc[data-search="true"] {
        outline: 2px solid rgba(59, 130, 246, 0.35);
        outline-offset: 2px;
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.18);
      }
      me-tpc[data-search-active="true"] {
        outline: 2px solid rgba(59, 130, 246, 0.75);
        outline-offset: 2px;
        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.28);
      }
      me-tpc .text .me-search-mark {
        background: rgba(250, 204, 21, 0.45);
        color: inherit;
        padding: 0 2px;
        border-radius: 4px;
      }
    `,
    [panModeClass, viewModeClass]
  );

  return {
    isDarkCanvas,
    wrapperClassName,
    globalStyles,
  };
}
