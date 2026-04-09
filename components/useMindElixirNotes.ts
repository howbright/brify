"use client";

import { useState } from "react";

type AnyNode = {
  id: string;
  topic: string;
  note?: string | null;
};

type Params = {
  selectedNodeIdRef: React.RefObject<string | null>;
  selectedNodeElRef: React.RefObject<HTMLElement | null>;
  latestMindDataRef: React.RefObject<any>;
  noteBadgeSvg: string;
  normalizeMindData: (raw: any) => { data: any; node: AnyNode } | null;
  findNodeById: (node: AnyNode, id: string) => AnyNode | null;
  normalizeNodeId: (id: string) => string;
  onChangeRef: React.RefObject<((op: any) => void) | null | undefined>;
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
  onChangeRef,
  setSelectedNoteText,
}: Params) {
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null);

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

  const handleNoteSave = () => {
    const selectedId = noteTargetId ?? selectedNodeIdRef.current;
    const selectedEl = selectedNodeElRef.current as
      | (HTMLElement & { nodeObj?: AnyNode })
      | null;
    if (!selectedId || !selectedEl?.nodeObj) {
      setNoteEditorOpen(false);
      return;
    }
    const trimmed = noteDraft.trim();
    const normalizedLatest = normalizeMindData(latestMindDataRef.current);
    const latestRoot = normalizedLatest?.node ?? null;
    const latestNode =
      latestRoot && selectedId ? findNodeById(latestRoot, selectedId) : null;
    if (trimmed.length === 0) {
      delete selectedEl.nodeObj.note;
      if (latestNode) {
        delete latestNode.note;
      }
      selectedEl.removeAttribute("data-note");
      const dot = selectedEl.querySelector<HTMLElement>(".me-note-dot");
      if (dot) dot.remove();
      onChangeRef.current?.({
        name: "updateNote",
        id: normalizeNodeId(selectedId),
        value: null,
      });
      setSelectedNoteText(null);
      setNoteEditorOpen(false);
      return;
    }
    const clipped = trimmed.slice(0, 500);
    selectedEl.nodeObj.note = clipped;
    if (latestNode) {
      latestNode.note = clipped;
    }
    let dot = selectedEl.querySelector<HTMLElement>(".me-note-dot");
    if (!dot) {
      dot = document.createElement("span");
      dot.className = "me-note-dot";
      dot.setAttribute("data-note-dot", "true");
      dot.innerHTML = noteBadgeSvg;
      selectedEl.appendChild(dot);
    }
    dot.setAttribute("data-nodeid", selectedEl.dataset.nodeid ?? "");
    onChangeRef.current?.({
      name: "updateNote",
      id: normalizeNodeId(selectedId),
      value: clipped,
    });
    setSelectedNoteText(clipped);
    setNoteEditorOpen(false);
  };

  return {
    noteEditorOpen,
    setNoteEditorOpen,
    noteDraft,
    setNoteDraft,
    handleNoteClick,
    handleNoteSave,
  };
}
