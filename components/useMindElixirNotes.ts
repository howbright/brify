"use client";

import { useState } from "react";

const NODE_NOTE_MAX_LENGTH = 1000;

type AnyNode = {
  id: string;
  topic: string;
  note?: string | null;
};

type MindDataSnapshot = {
  data: unknown;
  node: AnyNode;
};

type NoteUpdateOperation = {
  name: "updateNote";
  id: string;
  value: string | null;
};

type Params = {
  selectedNodeIdRef: React.RefObject<string | null>;
  selectedNodeElRef: React.RefObject<HTMLElement | null>;
  latestMindDataRef: React.RefObject<unknown>;
  noteBadgeSvg: string;
  normalizeMindData: (raw: unknown) => MindDataSnapshot | null;
  findNodeById: (node: AnyNode, id: string) => AnyNode | null;
  normalizeNodeId: (id: string) => string;
  markLatestMindDataDirty: () => void;
  onChangeRef: React.RefObject<
    ((op: NoteUpdateOperation) => void) | null | undefined
  >;
  setSelectedNoteText: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useMindElixirNotes({
  selectedNodeIdRef,
  selectedNodeElRef,
  latestMindDataRef,
  noteBadgeSvg,
  normalizeMindData,
  findNodeById,
  normalizeNodeId,
  markLatestMindDataDirty,
  onChangeRef,
  setSelectedNoteText,
}: Params) {
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null);

  const syncNoteDecoration = (
    selectedEl: HTMLElement & { nodeObj?: AnyNode },
    noteText: string | null
  ) => {
    const normalized = noteText?.trim() ?? "";
    if (!normalized) {
      selectedEl.removeAttribute("data-note");
      const dot = selectedEl.querySelector<HTMLElement>(".me-note-dot");
      if (dot) dot.remove();
      const preview = selectedEl.querySelector<HTMLElement>(".me-note-preview");
      if (preview) preview.remove();
      return;
    }

    selectedEl.setAttribute("data-note", "true");

    let dot = selectedEl.querySelector<HTMLElement>(".me-note-dot");
    if (!dot) {
      dot = document.createElement("span");
      dot.className = "me-note-dot";
      dot.setAttribute("data-note-dot", "true");
      dot.innerHTML = noteBadgeSvg;
      selectedEl.appendChild(dot);
    }
    dot.setAttribute("data-nodeid", selectedEl.dataset.nodeid ?? "");

    let preview = selectedEl.querySelector<HTMLElement>(".me-note-preview");
    if (!preview) {
      preview = document.createElement("span");
      preview.className = "me-note-preview";
      preview.setAttribute("data-note-preview", "true");
      selectedEl.appendChild(preview);
    }
    preview.textContent = normalized;
  };

  const handleNoteClick = () => {
    const selectedId = selectedNodeIdRef.current;
    const selectedEl = selectedNodeElRef.current as
      | (HTMLElement & { nodeObj?: AnyNode })
      | null;
    if (!selectedId || !selectedEl?.nodeObj) return;
    setNoteTargetId(selectedId);
    setNoteDraft(selectedEl.nodeObj.note ?? "");
    setNoteEditorOpen(true);
  };

  const applyNoteValue = (nextValue: string | null) => {
    const selectedId = noteTargetId ?? selectedNodeIdRef.current;
    const selectedEl = selectedNodeElRef.current as
      | (HTMLElement & { nodeObj?: AnyNode })
      | null;
    if (!selectedId || !selectedEl?.nodeObj) {
      setNoteEditorOpen(false);
      return;
    }
    const trimmed = nextValue?.trim() ?? "";
    const normalizedLatest = normalizeMindData(latestMindDataRef.current);
    const latestRoot = normalizedLatest?.node ?? null;
    const latestNode =
      latestRoot && selectedId ? findNodeById(latestRoot, selectedId) : null;
    if (trimmed.length === 0) {
      delete selectedEl.nodeObj.note;
      if (latestNode) {
        delete latestNode.note;
      }
      markLatestMindDataDirty();
      syncNoteDecoration(selectedEl, null);
      onChangeRef.current?.({
        name: "updateNote",
        id: normalizeNodeId(selectedId),
        value: null,
      });
      setSelectedNoteText(null);
      setNoteEditorOpen(false);
      setNoteTargetId(null);
      return;
    }
    const clipped = trimmed.slice(0, NODE_NOTE_MAX_LENGTH);
    selectedEl.nodeObj.note = clipped;
    if (latestNode) {
      latestNode.note = clipped;
    }
    markLatestMindDataDirty();
    syncNoteDecoration(selectedEl, clipped);
    onChangeRef.current?.({
      name: "updateNote",
      id: normalizeNodeId(selectedId),
      value: clipped,
    });
    setSelectedNoteText(clipped);
    setNoteEditorOpen(false);
    setNoteTargetId(null);
  };

  const handleNoteSave = () => {
    applyNoteValue(noteDraft);
  };

  const handleNoteDelete = () => {
    setNoteDraft("");
    applyNoteValue(null);
  };

  return {
    noteEditorOpen,
    setNoteEditorOpen,
    noteDraft,
    setNoteDraft,
    handleNoteClick,
    handleNoteDelete,
    handleNoteSave,
  };
}
