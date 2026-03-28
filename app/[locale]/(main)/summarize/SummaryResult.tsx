"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface Props {
  text: string;
}

export default function SummaryResult({ text }: Props) {
  return (
    <div className="mt-10 space-y-4">
      <div
        id="textView"
        className="bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg p-6 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line"
      >
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
          {text || "요약 결과가 여기에 표시됩니다."}
        </ReactMarkdown>
      </div>
    </div>
  );
}
