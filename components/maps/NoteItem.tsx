"use client";

import { memo, useState } from "react";

export type NoteItemData = {
  id: string;
  text: string;
  createdAt: number;
  createdAtLabel: string;
};

function NoteItem({
  note,
  onDelete,
  onUpdate,
}: {
  note: NoteItemData;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);

  const cancelEdit = () => {
    setDraft(note.text);
    setEditing(false);
  };

  const saveEdit = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === note.text) {
      cancelEdit();
      return;
    }
    onUpdate(note.id, trimmed);
    setEditing(false);
  };

  return (
    <div
      className="
        rounded-2xl border border-neutral-200 bg-white p-3
        dark:border-white/10 dark:bg-white/[0.06]
      "
    >
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              saveEdit();
            }
          }}
          className="
            w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm
            outline-none focus:ring-2 focus:ring-blue-200
            dark:border-white/10 dark:bg-white/[0.06] dark:text-white
            dark:focus:ring-blue-500/20
          "
          rows={3}
        />
      ) : (
        <div className="text-sm text-neutral-900 dark:text-white whitespace-pre-wrap">
          {note.text}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-neutral-500 dark:text-white/60">
          {note.createdAtLabel}
        </span>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={saveEdit}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                저장
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs font-semibold text-neutral-500 hover:underline"
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs font-semibold text-neutral-700 hover:underline"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => onDelete(note.id)}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(NoteItem);
