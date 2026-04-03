"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import ClientMindElixir, {
  type ClientMindElixirHandle,
} from "@/components/ClientMindElixir";
import type { Database } from "@/app/types/database.types";

type JsonValue = Database["public"]["Tables"]["maps"]["Row"]["mind_elixir"];

type MindNode = {
  id?: string;
  topic?: string;
  expanded?: boolean;
  children?: MindNode[];
};

export type MapMiniPreviewData =
  | { nodeData?: MindNode; data?: { nodeData?: MindNode }; root?: { nodeData?: MindNode } }
  | MindNode
  | JsonValue
  | null
  | undefined;

function getRootNode(data: MapMiniPreviewData): MindNode | null {
  if (!data) return null;
  if (
    typeof data === "object" &&
    !Array.isArray(data) &&
    "nodeData" in data &&
    data.nodeData &&
    typeof data.nodeData === "object"
  ) {
    return data.nodeData as MindNode;
  }
  if (
    typeof data === "object" &&
    !Array.isArray(data) &&
    "data" in data &&
    data.data &&
    typeof data.data === "object" &&
    "nodeData" in data.data &&
    data.data.nodeData &&
    typeof data.data.nodeData === "object"
  ) {
    return data.data.nodeData as MindNode;
  }
  if (
    typeof data === "object" &&
    !Array.isArray(data) &&
    "root" in data &&
    data.root &&
    typeof data.root === "object" &&
    "nodeData" in data.root &&
    data.root.nodeData &&
    typeof data.root.nodeData === "object"
  ) {
    return data.root.nodeData as MindNode;
  }
  if (typeof data === "object" && ("topic" in data || "children" in data)) {
    return data as MindNode;
  }
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

function collapseToLevel(data: MapMiniPreviewData, level = 1) {
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
  center: () => void;
};

const MapMiniPreview = forwardRef<MapMiniPreviewHandle, {
  data?: MapMiniPreviewData;
  emptyText?: string;
}>(({ data, emptyText = "Preview unavailable" }, ref) => {
  const root = useMemo(() => getRootNode(data), [data]);
  const collapsed = useMemo(() => {
    if (!root) return null;
    return collapseToLevel(data, 1);
  }, [data, root]);
  const mindRef = useRef<ClientMindElixirHandle | null>(null);

  useImperativeHandle(ref, () => ({
    zoomIn: () => mindRef.current?.zoomIn(),
    zoomOut: () => mindRef.current?.zoomOut(),
    center: () => mindRef.current?.centerMap(),
  }));

  if (!root) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-slate-400 bg-white px-4 text-xs text-neutral-500 dark:border-white/20 dark:bg-[#0b1220]/85 dark:text-white/60">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-slate-400 bg-white dark:border-white/20 dark:bg-[#0b1220]/88">
      <div className="absolute inset-0">
        <ClientMindElixir
          ref={mindRef}
          data={collapsed}
          allowSampled={false}
          editMode="view"
          openMenuOnClick={false}
          fitOnInit
          preserveViewState={false}
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
