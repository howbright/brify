"use client";

import { memo, useState } from "react";
import { Icon } from "@iconify/react";

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
        rounded-2xl border border-slate-400 bg-white p-3
        dark:border-white/20 dark:bg-white/[0.08]
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
            w-full rounded-xl border border-slate-400 bg-white px-3 py-2 text-sm
            outline-none focus:ring-2 focus:ring-blue-200
            dark:border-white/20 dark:bg-white/[0.08] dark:text-white
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
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <button
                type="button"
                onClick={saveEdit}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-400 text-neutral-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:border-white/20 dark:text-white/60 dark:hover:text-blue-300 dark:hover:border-blue-500/25 dark:hover:bg-blue-500/10"
                title="저장"
                aria-label="저장"
              >
                <Icon icon="mdi:content-save-outline" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-400 text-neutral-400 hover:text-neutral-600 hover:border-slate-500 hover:bg-neutral-50 dark:border-white/20 dark:text-white/45 dark:hover:text-white/70 dark:hover:border-white/28 dark:hover:bg-white/10"
                title="취소"
                aria-label="취소"
              >
                <Icon icon="mdi:close-circle-outline" className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-400 text-neutral-500 hover:text-neutral-700 hover:border-slate-500 hover:bg-neutral-50 dark:border-white/20 dark:text-white/60 dark:hover:text-white/85 dark:hover:border-white/28 dark:hover:bg-white/10"
                title="수정"
                aria-label="수정"
              >
                <Icon icon="mdi:pencil-outline" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(note.id)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-400 text-neutral-400 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50 dark:border-white/20 dark:text-white/45 dark:hover:text-rose-300 dark:hover:border-rose-500/25 dark:hover:bg-rose-500/10"
                title="삭제"
                aria-label="삭제"
              >
                <Icon icon="mdi:close" className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(NoteItem);
