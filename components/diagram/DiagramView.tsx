"use client";

import { classicStyle } from "@/styles/presets";
import "@xyflow/react/dist/style.css";
import { CSSProperties, useCallback, useEffect, useState } from "react";
import DiagramStyleSelector from "../DiagramStyleSelector";
import { CustomNode } from "./CustomNode";
// after
import { MyFlowEdge, MyFlowNode } from "@/app/types/diagram";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange
} from "@xyflow/react";

const nodeTypes = { custom: CustomNode };

// after
interface DiagramViewProps {
  summaryId: string;
  nodes: MyFlowNode[];
  edges: MyFlowEdge[];
}

export default function DiagramView({
  summaryId,
  nodes,
  edges,
}: DiagramViewProps) {
  const [stylePreset, setStylePreset] = useState(classicStyle);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);

  // after
  const [flowNodes, setFlowNodes] = useState<MyFlowNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<MyFlowEdge[]>([]);

  const [autoSave, setAutoSave] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // === API CALLS ===
  const saveTempDiagram = useCallback(
    async (nodes: any, edges: any) => {
      setIsSaving(true);
      try {
        await fetch(`/api/summaries/${summaryId}/temp-diagram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        });
      } finally {
        setIsSaving(false);
      }
    },
    [summaryId]
  );

  useEffect(() => {
    console.log(nodes)
    console.log(edges)

  }, [])

  const commitDiagram = useCallback(
    async (nodes: any, edges: any) => {
      setIsSaving(true);
      try {
        await fetch(`/api/summaries/${summaryId}/commit-diagram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        });
        setDirty(false);
      } finally {
        setIsSaving(false);
      }
    },
    [summaryId]
  );

  const resetDiagram = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/summaries/${summaryId}/reset-diagram`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.diagram_json) {
        setFlowNodes(data.diagram_json.nodes || []);
        setFlowEdges(data.diagram_json.edges || []);
      }
      setDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [summaryId]);

  const onUpdateNode = useCallback(
    (id: string, newText: string, type: "title" | "description") => {
      setFlowNodes((nds) => {
        const newNodes = nds.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  title: type === "title" ? newText : n.data.title,
                  description:
                    type === "description" ? newText : n.data.description,
                },
              }
            : n
        );

        // autoSave일 때 저장 로직 실행
        if (autoSave) {
          saveTempDiagram(newNodes, flowEdges);
        } else {
          setDirty(true);
        }
        return newNodes;
      });
    },
    [autoSave, flowEdges, saveTempDiagram] // flowNodes 제거!
  );

  // props 변화 시 상태 초기화
  useEffect(() => {
    const styled: MyFlowNode[] = (nodes ?? []).map((node) => ({
      ...node,
      type: "custom" as const, // ✅ 리터럴 고정
      style: stylePreset.node as CSSProperties, // ✅ CSSProperties로 캐스팅
      data: {
        ...node.data,
        onUpdate: onUpdateNode, // ✅ 런타임 콜백 주입
      },
    }));
    setFlowNodes(styled); // ✅ MyFlowNode[]로 딱 맞음
    setFlowEdges((edges ?? []) as MyFlowEdge[]);
  }, [nodes, edges, stylePreset, onUpdateNode]);

  const onNodesChange = useCallback(
    (changes: any) => setFlowNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setFlowEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div className="h-[600px] border rounded bg-white relative">
      {/* 상단 바 */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10 bg-white/80 px-3 py-1 rounded shadow">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <span>자동 저장</span>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />
        </label>

        {!autoSave && (
          <>
            <button
              onClick={() => commitDiagram(flowNodes, flowEdges)}
              disabled={!dirty || isSaving}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "저장하기"}
            </button>
            <button
              onClick={resetDiagram}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              초기화
            </button>
          </>
        )}
        {autoSave && (
          <span className="text-xs text-gray-500">
            {isSaving ? "자동 저장 중..." : "모두 저장됨"}
          </span>
        )}
      </div>

      <ReactFlowProvider>
        <ReactFlow<MyFlowNode, MyFlowEdge>
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          panOnScroll
          panOnDrag
          zoomOnScroll={false}
          nodesDraggable={true}
          elementsSelectable={true}
          nodeTypes={nodeTypes}
        >
          <MiniMap style={{ width: 100, height: 70 }} zoomable pannable />
          <Controls position="top-left" />
          <Background />
        </ReactFlow>
      </ReactFlowProvider>

      <DiagramStyleSelector
        open={stylePickerOpen}
        onClose={() => setStylePickerOpen(false)}
        onSelect={(style) => setStylePreset(style)}
      />
    </div>
  );
}
