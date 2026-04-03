"use client";

import { useCallback, useEffect } from "react";

type UseMindElixirContextMenuParams = {
  elRef: React.RefObject<HTMLDivElement | null>;
  selectedNodeIdRef: React.RefObject<string | null>;
  selectedNodeElRef: React.RefObject<HTMLElement | null>;
  getNodeElById: (id: string) => HTMLElement | null;
  disableDirectContextMenu?: boolean;
};

export function useMindElixirContextMenu({
  elRef,
  selectedNodeIdRef,
  selectedNodeElRef,
  getNodeElById,
  disableDirectContextMenu = false,
}: UseMindElixirContextMenuParams) {
  const openNodeContextMenu = useCallback(
    (nodeId?: string | null, anchorEl?: HTMLElement | null) => {
      const targetId = nodeId ?? selectedNodeIdRef.current;
      if (!targetId) return;
      const nodeEl =
        getNodeElById(targetId) ?? selectedNodeElRef.current ?? null;
      if (!nodeEl) return;
      const triggerRect = (anchorEl ?? nodeEl).getBoundingClientRect();
      nodeEl.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          button: 2,
          buttons: 2,
          clientX: triggerRect.right + 8,
          clientY: triggerRect.top + triggerRect.height / 2,
          view: window,
        })
      );
    },
    [getNodeElById, selectedNodeElRef, selectedNodeIdRef]
  );

  useEffect(() => {
    if (!disableDirectContextMenu) return;
    const host = elRef.current;
    if (!host) return;

    const handleContextMenuCapture = (event: MouseEvent) => {
      if (!event.isTrusted) return;
      event.preventDefault();
      event.stopPropagation();
    };

    host.addEventListener("contextmenu", handleContextMenuCapture, true);
    return () => {
      host.removeEventListener("contextmenu", handleContextMenuCapture, true);
    };
  }, [disableDirectContextMenu, elRef]);

  return {
    openNodeContextMenu,
  };
}
