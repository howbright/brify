// 📁 components/SummaryResult.tsx

"use client";

import { treeToFlowElements } from "@/app/lib/gtp/transformTree";
import { TreeNode } from "@/app/types/tree";
import React, { useEffect, useState } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

interface Props {
  viewType: "text" | "diagram" | "both";
  text?: string;
  tree?: TreeNode;
}

export default function SummaryResult({ viewType, text, tree }: Props) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!tree) return;
    treeToFlowElements(tree).then(({ nodes, edges }) => {
      setNodes(nodes);
      setEdges(edges);
    });
  }, [tree]);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6">요약 결과</h2>

      {viewType === "text" && text && (
        <div className="whitespace-pre-wrap bg-white p-6 rounded-lg shadow mb-10 border text-gray-800">
          {text}
        </div>
      )}

      {viewType === "diagram" && tree && (
        <div className="h-[600px] border rounded">
          <ReactFlowProvider>
            <ReactFlow nodes={nodes} edges={edges} fitView>
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      )}

      {viewType === "both" && text && tree && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="whitespace-pre-wrap bg-white p-6 rounded-lg shadow border text-gray-800">
            {text}
          </div>
          <div className="h-[600px] border rounded">
            <ReactFlowProvider>
              <ReactFlow nodes={nodes} edges={edges} fitView>
                <MiniMap />
                <Controls />
                <Background />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>
      )}
    </div>
  );
}