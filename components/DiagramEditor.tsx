"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

import ELK from "elkjs/lib/elk.bundled.js";

import { classicStyle, brutalistStyle, cuteStyle } from "../styles/presets";

const elk = new ELK();

const initialNodes: Node[] = [
  {
    id: "1",
    data: { label: "Hello" },
    position: { x: 0, y: 0 },
  },
  {
    id: "2",
    data: { label: "World" },
    position: { x: 0, y: 0 },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", type: "default" },
];

export default function DiagramEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [stylePreset, setStylePreset] = useState(classicStyle);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const CustomNode = ({ data }: any) => {
    const style = stylePreset.node;
    return (
      <div
        style={{
          backgroundColor: style.backgroundColor,
          border: `1px solid ${style.borderColor}`,
          borderRadius: style.borderRadius,
          fontFamily: style.font,
          padding: 10,
          boxShadow: style.shadow ? "2px 2px 6px rgba(0,0,0,0.2)" : "none",
        }}
      >
        {data.label}
      </div>
    );
  };

  const nodeTypes = { custom: CustomNode };

  // 🎯 ELK.js 레이아웃 적용 함수
  const applyLayout = async () => {
    const graph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered", // layered, force, etc.
        "elk.direction": "RIGHT",
        "elk.spacing.nodeNode": "40",
      },
      children: nodes.map((node) => ({
        id: node.id,
        width: 150,
        height: 50,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    };

    const layout = await elk.layout(graph);

    if (!layout.children) {
      console.warn("ELK layout failed or returned no children");
      return;
    }

    const positionedNodes = nodes.map((node) => {
      const layoutNode = layout.children!.find((n) => n.id === node.id);
      return {
        ...node,
        position: {
          x: layoutNode?.x || 0,
          y: layoutNode?.y || 0,
        },
      };
    });

    setNodes(positionedNodes);
  };

  return (
    <ReactFlowProvider>
      <div className="w-full h-[80vh] border rounded relative">
        <div className="absolute top-2 left-2 z-10 flex gap-2 bg-white p-2 rounded shadow">
          <button onClick={() => setStylePreset(classicStyle)}>
            🎩 클래식
          </button>
          <button onClick={() => setStylePreset(brutalistStyle)}>
            🧱 브루탈리즘
          </button>
          <button onClick={() => setStylePreset(cuteStyle)}>🐰 귀엽게</button>
          <button onClick={applyLayout}>📐 자동 정렬</button>
        </div>
        <ReactFlow
          nodes={nodes.map((n) => ({ ...n, type: "custom" }))}
          edges={edges.map((e) => ({
            ...e,
            style: { stroke: stylePreset.edge.stroke },
            type: stylePreset.edge.type,
          }))}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
