// 📁 components/SummaryResult.tsx

"use client";

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
import { treeToFlowElements } from "@/app/lib/gtp/transformTree";

interface Props {
  viewType: "text" | "diagram" | "both";
  text?: string;
  tree?: TreeNode;
}

export default function SummaryResult({ viewType, text, tree }: Props) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [comments, setComments] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    if (!tree) return;
    treeToFlowElements(tree).then(({ nodes, edges }) => {
      setNodes(nodes);
      setEdges(edges);
    });
  }, [tree]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setComments((prev) => [...prev, inputValue.trim()]);
    setInputValue("");
  };

  return (
    <div className="max-w-6xl mx-auto pt-32 px-4">
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
          <div className="bg-white p-6 rounded-lg shadow border text-gray-800 whitespace-pre-wrap">
            {text}
          </div>
          <div className="h-[800px] border rounded bg-white">
            <ReactFlowProvider>
              <ReactFlow nodes={nodes} edges={edges} fitView>
                <MiniMap
                  style={{ width: 100, height: 70 }}
                  className="!top-2 !right-2 !w-[100px] !h-[70px] !opacity-80"
                />
               <Controls position="top-left" />
                <Background />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>
      )}

      {/* 💬 전체 코멘트 */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-4">💬 전체 코멘트</h3>

        {comments.length === 0 && (
          <p className="text-sm text-gray-500 mb-4">
            아직 작성된 코멘트가 없습니다.
          </p>
        )}

        <ul className="space-y-2 mb-6">
          {comments.map((comment, index) => (
            <li
              key={index}
              className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-sm shadow"
            >
              {comment}
            </li>
          ))}
        </ul>

        <form onSubmit={handleCommentSubmit} className="mb-6">
          <div className="py-2 px-4 mb-4 bg-white rounded-lg rounded-t-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <label htmlFor="comment" className="sr-only">
              Your comment
            </label>
            <textarea
              id="comment"
              rows={6}
              className="px-0 w-full text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none dark:text-white dark:placeholder-gray-400 dark:bg-gray-800"
              placeholder="Write a comment..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-blue-600 rounded-lg focus:ring-4 focus:ring-blue-300 hover:bg-blue-700"
          >
            Post comment
          </button>
        </form>
      </div>
    </div>
  );
}
