// 📁 components/SummaryResult.tsx

"use client";

import { treeToFlowElements } from "@/app/lib/gtp/transformTree";
import { MyNodeData, TreeNode } from "@/app/types/tree";
import { Icon } from "@iconify/react";
import { Edge, Node } from "@xyflow/react";
import React, { useEffect, useRef, useState } from "react";
import DiagramView from "./diagram/DiagramView";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface Props {
  text?: string;
  tree?: TreeNode | null | undefined;
}

export default function SummaryResult({ text, tree }: Props) {

  console.log("✅ text:", text);
console.log("✅ tree:", tree);

  const [comments, setComments] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");

  const [nodes, setNodes] = useState<Node<MyNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const commentRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  // const params = useParams();
  // const id = params?.id as string;

  const scrollToComment = () => {
    commentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToDiagram = () => {
    diagramRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    console.log("tree: ", tree);
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
    <div className="max-w-6xl mx-auto min-h-screen">
      <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
        핵심정리 결과
        {/* <button
          onClick={scrollToDiagram}
          className="ml-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
        >
          <Icon icon="mdi:graph-outline" className="w-4 h-4" />
          다이어그램 보기
        </button> */}
      </h2>

      {text && (
        <div className="relative bg-white p-6 rounded-lg shadow-sm mb-10 border text-gray-800 prose max-w-none max-h-[500px] overflow-auto">
          <button
            onClick={scrollToDiagram}
            className="sticky top-0 right-0 float-right z-10 mt-1 mr-1 flex items-center gap-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full shadow"
          >
            <Icon icon="mdi:graph-outline" className="w-4 h-4" />
            다이어그램 보기
          </button>
          {/* <EditableMarkdownBlock
            markdown={text}
            onSave={async (newText) => {
              // Supabase 저장 로직 예시
              await supabase
                .from("summaries")
                .update({ summary_text: newText })
                .eq("id", id);
            }}
          /> */}
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]} // HTML 태그 포함 허용
            components={{
              h3: ({ node, ...props }) => (
                <h3 className="text-lg font-bold mt-4" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="text-base leading-relaxed my-2" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside ml-4 my-2" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="text-base leading-relaxed" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic text-gray-600 dark:text-gray-300 my-2"
                  {...props}
                />
              ),
              mark: ({ node, ...props }) => (
                <mark
                  className="bg-yellow-200 dark:bg-yellow-400/20 text-inherit px-1 rounded"
                  {...props}
                />
              ),
              span: ({ node, ...props }) => {
                const className = props.className || "";
                if (className.includes("highlight")) {
                  return (
                    <span
                      className="bg-yellow-200 dark:bg-yellow-400/20 text-inherit px-1 rounded font-medium"
                      {...props}
                    />
                  );
                }
                return <span {...props} />;
              },
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      )}

      {tree && (
        <div ref={diagramRef}>
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
