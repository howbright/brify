// SummaryViewer.tsx
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Icon } from "@iconify/react";
import { Fuzzy_Bubbles } from "next/font/google";

interface SummaryViewerProps {
  text: string;
  onEdit: () => void;
  scrollToComment: () => void;
  scrollToTop: () => void;
  scrollToDiagram: () => void;
  onFullView?: () => void;
  fullMode?: boolean;
}

export default function SummaryViewer({
  text,
  onEdit,
  scrollToComment,
  scrollToTop,
  scrollToDiagram,
  onFullView,
  fullMode = false,
}: SummaryViewerProps) {
  return (
    <div className="relative mb-10">
      {fullMode && (
        <div className="absolute flex flex-row gap-2 right-3 top-7">
          <button
            onClick={onEdit}
            title="수정하기"
            className={`p-2 rounded-full border shadow hover:bg-gray-100 bg-accent-blue`}
          >
            <Icon icon="mdi:pencil-outline" className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={scrollToComment}
            title="코멘트"
            className="p-2 rounded-full border bg-accent-blue shadow hover:bg-gray-100"
          >
            <Icon
              icon="mdi:comment-outline"
              className="w-5 h-5 text-gray-700"
            />
          </button>
        </div>
      )}
      <div className="sticky z-10 p-2 flex justify-end gap-2">
        {!fullMode && (
          <>
            <button
              onClick={onEdit}
              title="수정하기"
              className={`p-2 rounded-full border bg-white shadow hover:bg-gray-100`}
            >
              <Icon
                icon="mdi:pencil-outline"
                className="w-5 h-5 text-gray-700"
              />
            </button>

            <button
              onClick={scrollToComment}
              title="코멘트"
              className="p-2 rounded-full border bg-white shadow hover:bg-gray-100"
            >
              <Icon
                icon="mdi:comment-outline"
                className="w-5 h-5 text-gray-700"
              />
            </button>
            <button
              onClick={onFullView}
              title="전체 보기"
              className="p-2 rounded-full border bg-white shadow hover:bg-gray-100"
            >
              <Icon icon="mdi:fullscreen" className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={scrollToDiagram}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow transition"
              title="다이어그램 보기"
            >
              <Icon icon="mdi:graph-outline" className="w-4 h-4" />
              <span>다이어그램 보기</span>
            </button>
          </>
        )}
      </div>

      <div className={`bg-white px-6 pb-12 rounded-lg  ${fullMode ? 'border-0 shadow-none': 'border shadow-sm'} text-gray-800 prose max-w-none max-h-[calc(100vh-150px)] overflow-y-scroll scrollbar scrollbar-thumb-gray-400 scrollbar-track-gray-200 scrollbar-always`}>
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: ({ node, ...props }) => (
              <h3 className="text-2xl font-bold mt-4" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h3 className="text-xl font-bold mt-4" {...props} />
            ),
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
                className="border-l-4 border-gray-300 pl-3 italic text-gray-600 my-2"
                {...props}
              />
            ),
            mark: ({ node, ...props }) => (
              <mark className="bg-yellow-200 px-1 rounded" {...props} />
            ),
            span: ({ node, ...props }) => {
              const className = props.className || "";
              if (className.includes("highlight")) {
                return (
                  <span
                    className="bg-yellow-200 px-1 rounded font-medium"
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
    </div>
  );
}
