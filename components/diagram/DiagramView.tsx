"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Edge as FlowEdge,
  Node as FlowNode,
  MiniMap,
  NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { MyNodeData } from "@/app/types/tree";
import { classicStyle } from "@/styles/presets";
import DiagramStyleSelector from "../DiagramStyleSelector";
import { CustomNode } from "./CustomNode";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface DiagramViewProps {
  nodes: FlowNode<MyNodeData>[];
  edges: FlowEdge[];
}

export default function DiagramView({ nodes, edges }: DiagramViewProps) {
  const [stylePreset, setStylePreset] = useState(classicStyle);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);

  // === ReactFlow에서 상태로 관리해야 드래그가 반영됨 ===
  const [flowNodes, setFlowNodes] = useState<FlowNode<MyNodeData>[]>([]);
  const [flowEdges, setFlowEdges] = useState<FlowEdge[]>([]);

  const onUpdateNode = useCallback(
    (id: string, newText: string, type: "title" | "description") => {
      setFlowNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  title: type === "title" ? newText : n.data.title,
                  description: type === "description" ? newText : n.data.description,
                },
              }
            : n
        )
      );
    },
    []
  );
  
  

  // props 변화 시 상태 업데이트
  useEffect(() => {
    const styledNodes = (nodes || []).map((node) => ({
      ...node,
      type: "custom",
      style: stylePreset.node,
      data: {
        ...node.data,
        onUpdate: onUpdateNode,  // <- 편집 시 호출됨
      },
    }));
    setFlowNodes(styledNodes);
    setFlowEdges(edges || []);
  }, [nodes, edges, stylePreset]);

  // === 위치 변경 이벤트 ===
  const onNodesChange = useCallback(
    (changes:any) => setFlowNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes:any) => setFlowEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div className="h-[600px] border rounded bg-white relative">
      <ReactFlowProvider>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange} // 위치 변경 반영
          onEdgesChange={onEdgesChange}
          fitView
          panOnScroll
          panOnDrag
          zoomOnScroll={false}
          nodesDraggable={true}
          elementsSelectable={true}
          nodeTypes={nodeTypes}
        >
          <MiniMap
            style={{ width: 100, height: 70 }}
            zoomable
            pannable
            className="top-2! right-2! w-[100px]! h-[70px]! opacity-80!"
          />
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
