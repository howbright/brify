// 📁 components/SummaryResult.tsx

"use client";

import { treeToFlowElements } from "@/app/lib/gtp/transformTree";
import { MyNodeData, TreeNode } from "@/app/types/tree";
import { Icon } from "@iconify/react";
import { Edge, Node } from "@xyflow/react";
import React, { useEffect, useRef, useState } from "react";
import DiagramView from "./diagram/DiagramView";

interface Props {
  viewType: "text" | "diagram" | "both";
  text?: string;
  tree?: TreeNode | null | undefined;
}

export default function SummaryResult({ viewType, text, tree }: Props) {
  const [comments, setComments] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");

  const [nodes, setNodes] = useState<Node<MyNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const commentRef = useRef<HTMLDivElement>(null);

  const scrollToComment = () => {
    commentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
    <div className="max-w-6xl mx-auto py-20 px-4 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">핵심정리 결과</h2>

      {viewType === "text" && text && (
        <div className="whitespace-pre-wrap bg-white p-6 rounded-lg shadow-sm mb-10 border text-gray-800">
          {text}
        </div>
      )}

      {viewType === "diagram" && tree && (
        <DiagramView nodes={nodes} edges={edges} />
      )}

      {viewType === "both" && text && tree && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-gray-800 whitespace-pre-wrap">
            {text}
          </div>
          <DiagramView nodes={nodes} edges={edges} />
        </div>
      )}

      {/* 💬 전체 코멘트 */}
      <div ref={commentRef} className="mt-5">
        {/* <h3 className="text-lg font-semibold mb-4">💬 전체 코멘트</h3>

        {comments.length === 0 && (
          <p className="text-sm text-gray-500 mb-4">아직 작성된 코멘트가 없습니다.</p>
        )} */}

        <ul className="space-y-2 mb-6">
          {comments.map((comment, index) => (
            <li
              key={index}
              className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-sm shadow-sm"
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
              className="px-0 w-full text-sm text-gray-900 border-0 focus:ring-0 focus:outline-hidden dark:text-white dark:placeholder-gray-400 dark:bg-gray-800"
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
      {/* 👇 스크롤 다운 버튼 */}
      <button
        onClick={scrollToComment}
        className="fixed bottom-6 right-6 bg-black text-white rounded-full p-3 shadow-lg hover:bg-gray-800 transition"
        aria-label="댓글로 이동"
      >
        <Icon icon="mdi:chevron-down" className="w-6 h-6" />
      </button>
    </div>
  );
}
