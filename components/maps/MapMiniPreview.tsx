"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import ClientMindElixir, {
  type ClientMindElixirHandle,
} from "@/components/ClientMindElixir";

type MindNode = {
  id?: string;
  topic?: string;
  expanded?: boolean;
  children?: MindNode[];
};

function getRootNode(data: any): MindNode | null {
  if (!data) return null;
  if (data.nodeData) return data.nodeData as MindNode;
  if (data.data?.nodeData) return data.data.nodeData as MindNode;
  if (data.root?.nodeData) return data.root.nodeData as MindNode;
  if (data.topic || data.children) return data as MindNode;
  return null;
}

function cloneData<T>(value: T): T {
  try {
    if (typeof structuredClone === "function") return structuredClone(value);
  } catch {}
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function collapseToLevel(data: any, level = 1) {
  const cloned = cloneData(data);
  const root = getRootNode(cloned);
  if (!root) return cloned;

  const walk = (node: MindNode, depth: number) => {
    node.expanded = depth < level;
    node.children?.forEach((child) => walk(child, depth + 1));
  };

  walk(root, 0);
  return cloned;
}

export type MapMiniPreviewHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
};

const MapMiniPreview = forwardRef<MapMiniPreviewHandle, {
  data?: any | null;
  emptyText?: string;
}>(({ data, emptyText = "Preview unavailable" }, ref) => {
  const root = getRootNode(data);
  if (!root) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-xs text-neutral-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
        {emptyText}
      </div>
    );
  }

  const collapsed = collapseToLevel(data, 1);
  const mindRef = useRef<ClientMindElixirHandle | null>(null);

  useImperativeHandle(ref, () => ({
    zoomIn: () => mindRef.current?.zoomIn(),
    zoomOut: () => mindRef.current?.zoomOut(),
  }));

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#0b1220]/70">
      <div className="absolute inset-0">
        <ClientMindElixir
          ref={mindRef}
          data={collapsed}
          editMode="view"
          openMenuOnClick={false}
          fitOnInit
          zoomSensitivity={0.08}
          dragButton={2}
          panMode
          panModeButton={2}
          showMiniMap={false}
        />
      </div>
    </div>
  );
});

MapMiniPreview.displayName = "MapMiniPreview";

export default MapMiniPreview;
