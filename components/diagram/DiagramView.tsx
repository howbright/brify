"use client";

import React, { useMemo, useState } from "react";
import DiagramStyleSelector from "../DiagramStyleSelector";
import { classicStyle } from "@/styles/presets";
import StyledNode from "./StyledNode";
import {
  Node as FlowNode,
  Edge as FlowEdge,
} from "@xyflow/react";
import { Background, Controls, MiniMap, Panel, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { MyNodeData } from "@/app/types/tree";
import '@xyflow/react/dist/style.css';

interface DiagramViewProps {
  nodes: FlowNode<MyNodeData>[];
  edges: FlowEdge[];
}

export default function DiagramView({ nodes, edges }: DiagramViewProps) {
  console.log(nodes);
  console.log(edges);
  const [stylePreset, setStylePreset] = useState(classicStyle);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);

  const nodeTypes = useMemo(() => {
    return {
      custom: (props: any) => (
        <StyledNode {...props} stylePreset={stylePreset} />
      ),
    };
  }, [stylePreset]);

  // const edgeTypes = useMemo(() => {
  //   return {
  //     custom: (props: any) => (
  //       <Edge {...props} stylePreset={stylePreset} />
  //     ),
  //   };
  // }, [stylePreset]);

  const styledNodes = useMemo(() => {
    return (nodes || []).map((node) => ({
      ...node,
      style: stylePreset.node,
    }));
  }, [nodes,stylePreset]);

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
        >
          <button
            onClick={() => setStylePickerOpen(true)}
            className="absolute top-2 left-2 z-10 flex gap-2 bg-white p-2 rounded shadow"
          >
            🎨 스타일
          </button>
          <Panel>
            <div>variant:</div>
          </Panel>
          <MiniMap
            style={{ width: 100, height: 70 }}
            className="!top-2 !right-2 !w-[100px] !h-[70px] !opacity-80"
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
