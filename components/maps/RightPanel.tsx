"use client";

import { Icon } from "@iconify/react";
import { ReactNode, useEffect, useRef, useState } from "react";
import NoteItem, { type NoteItemData } from "@/components/maps/NoteItem";
import TermsBlock from "@/components/maps/TermsBlock";
import { createClient } from "@/utils/supabase/client";

type TermItem = {
  term: string;
  meaning: string;
  updatedAt?: number;
  isNew?: boolean;
};
type NoteItem = NoteItemData;

export type RightPanelTab = "notes" | "terms";

type Props = {
  open: boolean;
  initialTab?: RightPanelTab; // 열릴 때 기본 탭
  onClose: () => void;
  mapId: string;
};

export default function RightPanel({
  open,
  initialTab = "notes",
  onClose,
  mapId,
}: Props) {
  const [tab, setTab] = useState<RightPanelTab>(initialTab);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termsStatus, setTermsStatus] = useState<
    "idle" | "queued" | "running" | "succeeded" | "failed"
  >("idle");
  const termsPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const termsHighlightRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    fetchTerms(true);
    fetchTermsStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  const fetchNotes = async () => {
    if (!mapId) return;
    setNotesLoading(true);
    setNotesError(null);
    try {
      const res = await fetch(
        `/api/notes?mapId=${encodeURIComponent(mapId)}&limit=200`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "FAILED_TO_FETCH_NOTES");
      }
      const items: NoteItem[] = Array.isArray(json.items)
        ? json.items.map((row: any) => {
            const createdAt = new Date(row.created_at).getTime();
            return {
              id: String(row.id),
              text: String(row.text ?? ""),
              createdAt,
              createdAtLabel: new Date(createdAt).toLocaleString(),
            };
          })
        : [];
      setNotes(items);
    } catch (e: any) {
      setNotesError(e?.message ?? "FAILED_TO_FETCH_NOTES");
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (tab !== "notes") return;
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, mapId]);

  const addNote = async () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    if (!mapId) return;
    setNotesError(null);

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapId, text: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "FAILED_TO_ADD_NOTE");
      }
      const row = json.item ?? {};
      const createdAt = new Date(row.created_at).getTime();
      const item: NoteItem = {
        id: String(row.id),
        text: String(row.text ?? ""),
        createdAt,
        createdAtLabel: new Date(createdAt).toLocaleString(),
      };
      setNotes((prev) => [item, ...prev]);
      setNoteText("");
    } catch (e: any) {
      setNotesError(e?.message ?? "FAILED_TO_ADD_NOTE");
    }
  };

  const deleteNote = async (id: string) => {
    if (!id) return;
    setNotesError(null);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "FAILED_TO_DELETE_NOTE");
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e: any) {
      setNotesError(e?.message ?? "FAILED_TO_DELETE_NOTE");
    }
  };

  const updateNote = async (id: string, text: string) => {
    if (!id) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setNotesError(null);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "FAILED_TO_UPDATE_NOTE");
      }
      const row = json.item ?? {};
      const createdAt = new Date(row.created_at).getTime();
      const updated: NoteItem = {
        id: String(row.id),
        text: String(row.text ?? ""),
        createdAt,
        createdAtLabel: new Date(createdAt).toLocaleString(),
      };
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (e: any) {
      setNotesError(e?.message ?? "FAILED_TO_UPDATE_NOTE");
    }
  };

  const getAccessToken = async () => {
    const supabase = createClient();
    const { data: sessionData, error: sessionErr } =
      await supabase.auth.getSession();

    if (sessionErr) {
      throw new Error("세션을 가져오지 못했습니다: " + sessionErr.message);
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("로그인이 필요합니다.");
    }

    return accessToken;
  };

  const getApiBase = () => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base) {
      throw new Error("환경변수 NEXT_PUBLIC_API_BASE_URL이 없습니다.");
    }
    return base;
  };

  const stopTermsPolling = () => {
    if (termsPollRef.current) {
      clearInterval(termsPollRef.current);
      termsPollRef.current = null;
    }
  };

  const scheduleHighlightClear = () => {
    if (termsHighlightRef.current) {
      clearTimeout(termsHighlightRef.current);
    }
    termsHighlightRef.current = setTimeout(() => {
      setTerms((prev) => prev.map((item) => ({ ...item, isNew: false })));
    }, 4500);
  };

  const startTermsPolling = () => {
    if (termsStatus === "succeeded" || termsStatus === "failed") return;
    if (termsPollRef.current) return;
    termsPollRef.current = setInterval(() => {
      fetchTermsStatus();
    }, 1500);
  };

  const termKey = (item: Pick<TermItem, "term" | "meaning">) =>
    `${item.term}::${item.meaning}`;

  const fetchTerms = async (silent = false, markNew = false) => {
    if (!mapId) return;
    if (termsLoading && !silent) return;
    if (!silent) setTermsLoading(true);

    try {
      const accessToken = await getAccessToken();
      const base = getApiBase();

      const res = await fetch(`${base}/maps/${mapId}/terms`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.message || json?.error || "용어를 불러오지 못했습니다.";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
      }

      const rows = Array.isArray(json?.terms)
        ? json.terms
        : Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];

      const items: TermItem[] = rows.map((row: any) => {
        const rawTs =
          row.updated_at ?? row.updatedAt ?? row.created_at ?? row.createdAt;
        const updatedAt = rawTs ? new Date(rawTs).getTime() : 0;
        return {
          term: String(row.term ?? ""),
          meaning: String(row.meaning ?? ""),
          updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
          isNew: false,
        };
      });

      setTerms((prev) => {
        if (!markNew) {
          return items.map((item) => ({ ...item, isNew: false }));
        }
        const prevKeys = new Set(prev.map((item) => termKey(item)));
        const next = items.map((item) => ({
          ...item,
          isNew: !prevKeys.has(termKey(item)),
        }));
        scheduleHighlightClear();
        return next;
      });

    } catch (e) {
      console.error(e);
      setTermsError("용어를 불러오지 못했습니다.");
    } finally {
      if (!silent) setTermsLoading(false);
    }
  };

  const fetchTermsStatus = async () => {
    if (!mapId) return;
    try {
      const accessToken = await getAccessToken();
      const base = getApiBase();

      const res = await fetch(`${base}/maps/${mapId}/terms/status`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        const msg = json?.message || json?.error || "용어 상태 조회 실패";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
      }

      const status = json?.status ?? null;
      if (status === "queued" || status === "running") {
        setTermsStatus(status);
        startTermsPolling();
        setTermsError(null);
        return;
      }

      if (status === "succeeded") {
        setTermsStatus("succeeded");
        stopTermsPolling();
        await fetchTerms(true, true);
        setTermsError(null);
        return;
      }

      if (status === "failed") {
        setTermsStatus("failed");
        stopTermsPolling();
        setTermsError("용어 해설 생성에 실패했어요.");
      }
    } catch (e) {
      console.error(e);
      setTermsStatus("failed");
      stopTermsPolling();
      setTermsError("용어 상태를 확인하지 못했습니다.");
    }
  };

  const requestAutoTerms = async () => {
    if (!mapId || termsLoading) return;
    setTermsError(null);
    setTermsStatus("queued");
    startTermsPolling();
    setTermsLoading(true);
    try {
      const accessToken = await getAccessToken();
      const base = getApiBase();

      const res = await fetch(`${base}/maps/${mapId}/terms/auto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.message || json?.error || "용어 추출을 시작하지 못했습니다.";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
      }

      await fetchTermsStatus();
    } catch (e) {
      console.error(e);
      setTermsStatus("failed");
      stopTermsPolling();
      setTermsError("용어 해설 요청에 실패했어요.");
    } finally {
      setTermsLoading(false);
    }
  };

  const requestCustomTerms = async (termsCsv: string) => {
    if (!mapId || termsLoading) return;
    setTermsError(null);
    setTermsLoading(true);
    try {
      const accessToken = await getAccessToken();
      const base = getApiBase();

      const res = await fetch(`${base}/maps/${mapId}/terms/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ termsCsv }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.message || json?.error || "용어 해설을 시작하지 못했습니다.";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
      }

      await fetchTermsStatus();
    } catch (e) {
      console.error(e);
      setTermsError("용어 해설 요청에 실패했어요.");
    } finally {
      setTermsLoading(false);
    }
  };

  const deleteTerm = async (term: string) => {
    if (!mapId || !term || termsLoading) return;
    setTermsLoading(true);
    try {
      const accessToken = await getAccessToken();
      const base = getApiBase();

      const res = await fetch(
        `${base}/maps/${mapId}/terms/${encodeURIComponent(term)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.message || json?.error || "용어를 삭제하지 못했습니다.";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
      }

      setTerms((prev) => prev.filter((item) => item.term !== term));
    } catch (e) {
      console.error(e);
      setTermsError("용어를 삭제하지 못했습니다.");
    } finally {
      setTermsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      stopTermsPolling();
      if (termsHighlightRef.current) {
        clearTimeout(termsHighlightRef.current);
        termsHighlightRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      stopTermsPolling();
      if (termsHighlightRef.current) {
        clearTimeout(termsHighlightRef.current);
        termsHighlightRef.current = null;
      }
    };
  }, []);

  return (
    <SidePanel side="right" open={open} title="노트" onClose={onClose}>
      {/* tabs */}
      <div className="pt-3 mb-3 flex items-center gap-2">
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
            if (!termsLoading && terms.length === 0) fetchTerms();
          }}
        />
      </div>

      {tab === "notes" ? (
        <NotesBlock
          noteText={noteText}
          setNoteText={setNoteText}
          onAdd={addNote}
          notes={notes}
          loading={notesLoading}
          error={notesError}
          onDelete={deleteNote}
          onUpdate={updateNote}
        />
      ) : (
        <TermsBlock
          terms={terms}
          loading={
            termsLoading || termsStatus === "queued" || termsStatus === "running"
          }
          error={termsError}
          usedCount={0}
          onAutoExtract={requestAutoTerms}
          onExplainCustom={requestCustomTerms}
          onDeleteTerm={deleteTerm}
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

        <div className="flex-1 min-h-0 overflow-auto px-4 pb-4 pt-0">
          {children}
        </div>
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
  loading,
  error,
  onDelete,
  onUpdate,
}: {
  noteText: string;
  setNoteText: (v: string) => void;
  onAdd: () => void;
  notes: NoteItem[];
  loading: boolean;
  error: string | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-neutral-500 dark:text-white/60">
        구조맵을 보면서 떠오른 생각을 바로 적어둘 수 있어요.
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="노트를 적어주세요… (Enter로 추가)"
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

      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
            노트를 불러오는 중…
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
            아직 노트가 없어요.
          </div>
        ) : (
          notes.map((n) => (
            <NoteItem key={n.id} note={n} onDelete={onDelete} onUpdate={onUpdate} />
          ))
        )}
      </div>
    </div>
  );
}
