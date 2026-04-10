"use client";

import { useEffect } from "react";

type AnyNode = {
  id: string;
  topic: string;
  root?: boolean;
  parent?: { id?: string } | null;
};

type MobileAction = "addChild" | "addSibling" | "rename" | "remove";

type Params = {
  editMode: "view" | "edit";
  showMobileControls: boolean;
  mindRef: React.RefObject<any>;
  selectedNodeElRef: React.RefObject<HTMLElement | null>;
  selectedNodeId: string | null;
  selectedNodeIdRef: React.RefObject<string | null>;
  setMobileActionNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  getNodeElById: (id: string) => HTMLElement | null;
};

export function useMindElixirNodeActions({
  editMode,
  showMobileControls,
  mindRef,
  selectedNodeElRef,
  selectedNodeId,
  selectedNodeIdRef,
  setMobileActionNodeId,
  getNodeElById,
}: Params) {
  const waitForSelectionFrame = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

  const openNodeContextMenu = (
    nodeId?: string | null,
    anchorEl?: HTMLElement | null
  ) => {
    const targetId = nodeId ?? selectedNodeIdRef.current;
    if (!targetId) return;
    const nodeEl = getNodeElById(targetId) ?? selectedNodeElRef.current ?? null;
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
  };

  const runMobileNodeAction = async (action: MobileAction) => {
    const mind = mindRef.current;
    const selectedEl =
      (selectedNodeElRef.current as (HTMLElement & { nodeObj?: AnyNode }) | null) ??
      (selectedNodeIdRef.current
        ? ((getNodeElById(selectedNodeIdRef.current) as
            | (HTMLElement & { nodeObj?: AnyNode })
            | null) ?? null)
        : null);
    const currentNode =
      (selectedEl?.nodeObj ? selectedEl : null) ??
      ((mind?.currentNode as (HTMLElement & { nodeObj?: AnyNode }) | null) ?? null);
    if (!mind || !currentNode) return;

    try {
      let activeNode = currentNode;
      if (typeof mind.selectNode === "function") {
        mind.selectNode(currentNode);
        await waitForSelectionFrame();
        activeNode =
          (mind.currentNode as (HTMLElement & { nodeObj?: AnyNode }) | null) ??
          currentNode;
      }
      if (action === "addChild") {
        await mind.addChild(activeNode);
        setMobileActionNodeId(null);
        return;
      }
      if (action === "addSibling") {
        await mind.insertSibling("after", activeNode);
        setMobileActionNodeId(null);
        return;
      }
      if (action === "rename") {
        await mind.beginEdit(activeNode);
        setMobileActionNodeId(null);
        return;
      }
      const nodeObj = activeNode.nodeObj as AnyNode | undefined;
      const isRoot = nodeObj?.root || !nodeObj?.parent?.id;
      if (isRoot) return;
      await mind.removeNodes(mind.currentNodes ?? [activeNode]);
      setMobileActionNodeId(null);
    } catch (error) {
      console.error("[ME] mobile action failed:", action, error);
    }
  };

  const selectedNodeObj =
    (selectedNodeElRef.current as (HTMLElement & { nodeObj?: AnyNode }) | null)
      ?.nodeObj ?? null;
  const selectedNodeIsRoot = Boolean(
    selectedNodeObj?.root || !selectedNodeObj?.parent?.id
  );

  useEffect(() => {
    if (!showMobileControls || editMode !== "edit") {
      setMobileActionNodeId(null);
    }
  }, [showMobileControls, editMode, setMobileActionNodeId]);

  useEffect(() => {
    if (!selectedNodeId) {
      setMobileActionNodeId(null);
    }
  }, [selectedNodeId, setMobileActionNodeId]);

  return {
    openNodeContextMenu,
    runMobileNodeAction,
    selectedNodeIsRoot,
  };
}
