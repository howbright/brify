// 📁 components/EditableMarkdownBlock.tsx

"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import MarkdownEditor from "./ui/MarkdownEditor";

interface Props {
  markdown: string;
  onSave?: (newMarkdown: string) => Promise<void>; // 저장 콜백
  editable?: boolean; // 수정 버튼 노출 여부
}

export default function EditableMarkdownBlock({ markdown, onSave, editable = true }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(markdown);

  useEffect(() => {
    setEdited(markdown); // 외부에서 바뀔 경우 동기화
  }, [markdown]);

  const handleSave = async () => {
    if (onSave) await onSave(edited);
    setIsEditing(false);
  };

  return (
    <div className="relative bg-white border rounded-lg shadow-sm p-4 max-h-[500px] overflow-auto">
      {editable && (
        <div className="flex justify-end mb-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              ✏️ 수정
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
              💾 저장
            </button>
          )}
        </div>
      )}

      {isEditing ? (
        <MarkdownEditor initialContent={edited} onChange={(md) => setEdited(md)} />
      ) : (
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
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
          {markdown}
        </ReactMarkdown>
      )}
    </div>
  );
}
