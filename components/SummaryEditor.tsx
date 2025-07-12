// components/SummaryEditor.tsx
"use client";

import { useState } from "react";
import MarkdownEditor from "./ui/MarkdownEditor";

interface SummaryEditorProps {
  initialContent: string;
  onCancel: () => void;
  onSave: (markdown: string) => void;
}

export default function SummaryEditor({
  initialContent,
  onCancel,
  onSave,
}: SummaryEditorProps) {
  const [editedMarkdown, setEditedMarkdown] = useState(initialContent);

  return (
    <div className="border rounded-lg shadow-sm bg-white p-4 mb-4">
      <div className="flex justify-end mb-4">
        <button
          className="px-4 py-2 text-sm font-medium rounded bg-gray-300 hover:bg-gray-400 mr-2"
          onClick={onCancel}
        >
          취소
        </button>
        <button
          className="px-4 py-2 text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => onSave(editedMarkdown)}
        >
          저장
        </button>
      </div>
      <MarkdownEditor
        initialContent={editedMarkdown}
        onChange={(markdown) => setEditedMarkdown(markdown)}
      />
      <div className="flex justify-end mt-4">
        <button
          className="px-4 py-2 text-sm font-medium rounded bg-gray-300 hover:bg-gray-400 mr-2"
          onClick={onCancel}
        >
          취소
        </button>
        <button
          className="px-4 py-2 text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => onSave(editedMarkdown)}
        >
          저장
        </button>
      </div>
    </div>
  );
}
