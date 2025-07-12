"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { Markdown } from "tiptap-markdown";

interface Props {
  initialContent?: string;
  onChange?: (markdown: string) => void;
}

export default function MarkdownEditor({
  initialContent = "",
  onChange,
}: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Highlight, Markdown],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "prose max-w-none p-4 outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const md = editor.storage.markdown.getMarkdown();
      onChange?.(md);
    },
  });

  return (
    <div className="border rounded shadow-sm">
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="
    p-4 outline-none
    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4
    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4
    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4
    [&_p]:text-base [&_p]:leading-relaxed [&_p]:my-2
    [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-4 [&_ul]:my-2
    [&_li]:text-base [&_li]:leading-relaxed
    [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-2
    [&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:rounded
    [&_.highlight]:bg-yellow-200 [&_.highlight]:px-1 [&_.highlight]:rounded [&_.highlight]:font-medium
  "
      />
    </div>
  );
}

function Toolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  const btn = (cmd: string, label: string) => (
    <button
      onClick={() => editor.chain().focus()[cmd]().run()}
      className={`px-2 py-1 text-xs rounded ${
        editor.isActive(cmd.split(/([()])/)[0])
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-800"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex gap-2 p-2 border-b bg-gray-50">
      {btn("toggleBold", "Bold")}
      {btn("toggleHighlight", "Highlight")}
      {[1, 2, 3].map((l) => (
        <button
          key={l}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: l }).run()
          }
          className={`px-2 py-1 text-xs rounded ${
            editor.isActive("heading", { level: l })
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-800"
          }`}
        >
          H{l}
        </button>
      ))}
    </div>
  );
}
