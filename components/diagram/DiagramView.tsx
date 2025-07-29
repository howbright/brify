"use client";

import { MyNodeData } from "@/app/types/tree";
import { classicStyle } from "@/styles/presets";
import {
  Background,
  Controls,
  Edge as FlowEdge,
  Node as FlowNode,
  MiniMap,
  NodeTypes,
  Panel,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, useState } from "react";
import DiagramStyleSelector from "../DiagramStyleSelector";
import { CustomNode } from "./CustomNode";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface DiagramViewProps {
  nodes: FlowNode<MyNodeData>[];
  edges: FlowEdge[];
  onFullViewDiagram?: () => void;
}

export default function DiagramView({ nodes, edges, onFullViewDiagram }: DiagramViewProps) {
  console.log(nodes);
  console.log(edges);
  const [stylePreset, setStylePreset] = useState(classicStyle);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);

  const styledNodes = useMemo(() => {
    return (nodes || []).map((node) => ({
      ...node,
      type: "custom", // 👈 여기가 중요!
      style: stylePreset.node,
    }));
  }, [nodes, stylePreset]);

  // const styledEdges = useMemo(() => {
  //   return (edges || []).map((edge) => ({
  //     ...edge,
  //     type: "custom",
  //   }));
  // }, [edges]);

  return (
    <div className="h-[600px] border rounded bg-white relative">
      <ReactFlowProvider>
        {/* 💡 ReactFlow */}
        <ReactFlow
          nodes={styledNodes}
          edges={edges}
          fitView
          panOnScroll
          panOnDrag
          zoomOnScroll={false}
          nodeTypes={nodeTypes} // 👈 추가!
        >
          {/* <button
            onClick={() => setStylePickerOpen(true)}
            className="absolute top-2 left-2 z-10 flex gap-2 bg-white p-2 rounded shadow-sm"
          >
            🎨 스타일
          </button> */}
          {/* <Panel>
            <div>variant:</div>
          </Panel> */}
          <MiniMap
            style={{ width: 100, height: 70 }}
            className="top-2! right-2! w-[100px]! h-[70px]! opacity-80!"
            zoomable
            pannable
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
