// 📁 components/DiagramView.tsx

"use client";

import React from "react";
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

interface DiagramViewProps {
  nodes: Node[];
  edges: Edge[];
}

export default function DiagramView({ nodes, edges }: DiagramViewProps) {
  return (
    <div className="h-[600px] border rounded bg-white relative">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          panOnScroll
          panOnDrag={true}
          zoomOnScroll={false}
        >
          <MiniMap
            style={{ width: 100, height: 70 }}
            className="!top-2 !right-2 !w-[100px] !h-[70px] !opacity-80"
          />
          <Controls position="top-left" />
          <Background />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
