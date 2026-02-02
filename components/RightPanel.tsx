"use client";

import { Icon } from "@iconify/react";
import { ReactNode, useEffect, useMemo, useState } from "react";

type TermItem = { term: string; meaning: string };
type NoteItem = { id: string; text: string; createdAt: number };

export type RightPanelTab = "notes" | "terms";

type Props = {
  open: boolean;
  initialTab?: RightPanelTab; // 열릴 때 기본 탭
  onClose: () => void;

  // 노트
  notes: NoteItem[];
  setNotes: React.Dispatch<React.SetStateAction<NoteItem[]>>;

  // 용어
  terms: TermItem[];
  termsLoading: boolean;
  onFetchTerms: () => Promise<void>;
};

export default function RightPanel({
  open,
  initialTab = "notes",
  onClose,
  notes,
  setNotes,
  terms,
  termsLoading,
  onFetchTerms,
}: Props) {
  const [tab, setTab] = useState<RightPanelTab>(initialTab);
  const [noteText, setNoteText] = useState("");

  // ✅ 열릴 때 initialTab 반영
  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
  }, [open, initialTab]);

  // ✅ 용어 탭으로 전환되었는데 아직 로딩/데이터 필요하면 fetch
  useEffect(() => {
    if (!open) return;
    if (tab !== "terms") return;

    // terms가 이미 있고, loading도 아니면 굳이 또 안 불러도 됨(취향)
    // 필요하면 항상 refetch로 바꿔도 됨.
    if (termsLoading) return;
    if (terms.length > 0) return;

    onFetchTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  const addNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    setNotes((prev) => [
      {
        id: Math.random().toString(36).slice(2, 10),
        text: trimmed,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setNoteText("");
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SidePanel side="right" open={open} title="노트" onClose={onClose}>
      {/* tabs */}
      <div className="mb-3 flex items-center gap-2">
        <TabButton
          active={tab === "notes"}
          icon="mdi:notebook-outline"
          label="노트"
          onClick={() => setTab("notes")}
        />
        <TabButton
          active={tab === "terms"}
          icon="mdi:book-open-variant"
          label="용어"
          onClick={() => {
            setTab("terms");
            // 탭 클릭 시 즉시 fetch 트리거(원하면 여기서만 호출해도 됨)
            if (!termsLoading && terms.length === 0) onFetchTerms();
          }}
        />
      </div>

      {tab === "notes" ? (
        <NotesBlock
          noteText={noteText}
          setNoteText={setNoteText}
          onAdd={addNote}
          notes={notes}
          onDelete={deleteNote}
        />
      ) : (
        <TermsBlock
          terms={terms}
          loading={termsLoading}
          onRefetch={onFetchTerms}
        />
      )}
    </SidePanel>
  );
}

/* ---------------- UI: SidePanel (기존 그대로 복붙) ---------------- */

function SidePanel({
  side,
  open,
  title,
  onClose,
  children,
}: {
  side: "left" | "right";
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={`
        absolute top-0 z-[130] h-full w-[360px] max-w-[92vw]
        transition-transform duration-200 ease-out
        ${side === "left" ? "left-0" : "right-0"}
        ${
          open
            ? "translate-x-0"
            : side === "left"
            ? "-translate-x-full"
            : "translate-x-full"
        }
      `}
      aria-hidden={!open}
    >
      <div
        className="
          h-full
          border border-neutral-200 bg-white/95 backdrop-blur
          dark:border-white/10 dark:bg-[#0b1220]/85
          shadow-2xl
          flex flex-col
        "
      >
        <div className="shrink-0 px-4 py-3 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="
              inline-flex items-center justify-center
              h-8 w-8 rounded-xl
              border border-neutral-200 bg-white hover:bg-neutral-50
              dark:border-white/12 dark:bg-white/[0.06] dark:hover:bg-white/10
            "
            aria-label="패널 닫기"
            title="닫기"
          >
            <Icon icon="mdi:close" className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-semibold
        ${
          active
            ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/12 dark:text-blue-200"
            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
        }
      `}
    >
      <Icon icon={icon} className="h-4 w-4" />
      {label}
    </button>
  );
}

/* ---------------- Blocks ---------------- */

function NotesBlock({
  noteText,
  setNoteText,
  onAdd,
  notes,
  onDelete,
}: {
  noteText: string;
  setNoteText: (v: string) => void;
  onAdd: () => void;
  notes: NoteItem[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-neutral-500 dark:text-white/60">
        구조맵을 보면서 떠오른 생각을 바로 적어둘 수 있어요.
      </div>

      <div className="flex gap-2">
        <input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onAdd();
          }}
          placeholder="노트를 적어주세요… (Ctrl/⌘ + Enter로 추가)"
          className="
            flex-1 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm
            outline-none focus:ring-2 focus:ring-blue-200
            dark:border-white/10 dark:bg-white/[0.06] dark:text-white
            dark:focus:ring-blue-500/20
          "
        />
        <button
          type="button"
          onClick={onAdd}
          className="
            rounded-2xl border border-neutral-200 bg-white px-3 py-2
            text-sm font-semibold text-neutral-700 hover:bg-neutral-50
            dark:border-white/12 dark:bg-white/[0.06]
            dark:text-white/85 dark:hover:bg-white/10
          "
        >
          추가
        </button>
      </div>

      <div className="space-y-2">
        {notes.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
            아직 노트가 없어요.
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="
                rounded-2xl border border-neutral-200 bg-white p-3
                dark:border-white/10 dark:bg-white/[0.06]
              "
            >
              <div className="text-sm text-neutral-900 dark:text-white whitespace-pre-wrap">
                {n.text}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500 dark:text-white/60">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(n.id)}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TermsBlock({
  terms,
  loading,
  onRefetch,
}: {
  terms: TermItem[];
  loading: boolean;
  onRefetch: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-neutral-500 dark:text-white/60">
        어려운 용어가 자동으로 추출되어 뜻을 정리해줘요.
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
          용어를 불러오는 중…
        </div>
      ) : (
        <div className="space-y-2">
          {terms.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
              아직 용어가 없어요. “용어 다시 추출”을 눌러보세요.
            </div>
          ) : (
            terms.map((x) => (
              <div
                key={x.term}
                className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.06]"
              >
                <div className="font-semibold text-neutral-900 dark:text-white">
                  {x.term}
                </div>
                <div className="mt-1 text-sm text-neutral-700 dark:text-white/80">
                  {x.meaning}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onRefetch}
        className="
          inline-flex items-center gap-1.5
          rounded-2xl border border-neutral-200 bg-white px-3 py-2
          text-xs font-semibold text-neutral-700 hover:bg-neutral-50
          dark:border-white/12 dark:bg-white/[0.06]
          dark:text-white/85 dark:hover:bg-white/10
        "
      >
        <Icon icon="mdi:refresh" className="h-4 w-4" />
        용어 다시 추출
      </button>
    </div>
  );
}
