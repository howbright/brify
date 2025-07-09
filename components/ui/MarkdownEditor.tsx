"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { Markdown } from "tiptap-markdown";

interface Props {
  initialContent?: string;
  onChange?: (markdown: string) => void;
}

export default function MarkdownEditor({ initialContent = "", onChange }: Props) {
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
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  const btn = (cmd: string, label: string) => (
    <button
      onClick={() => (editor.chain().focus()[cmd]().run())}
      className={`px-2 py-1 text-xs rounded ${
        editor.isActive(cmd.split(/([()])/)[0]) ? "bg-blue-600 text-white" : "bg-white text-gray-800"
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
          onClick={() => editor.chain().focus().toggleHeading({ level: l }).run()}
          className={`px-2 py-1 text-xs rounded ${
            editor.isActive("heading", { level: l }) ? "bg-blue-600 text-white" : "bg-white text-gray-800"
          }`}
        >
          H{l}
        </button>
      ))}
    </div>
  );
}
