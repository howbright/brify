"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type NodeRichTextDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  plainTopicLabel: string;
  plainTopicValue: string;
  initialHtml: string;
  colors: Array<{ value: string; label: string }>;
  colorLabel: string;
  boldLabel: string;
  clearColorLabel: string;
  resetLabel: string;
  cancelLabel: string;
  saveLabel: string;
  onSave: (html: string) => void;
};

type ToolbarState = {
  bold: boolean;
  color: string;
};

function normalizeColorValue(raw: string | null | undefined) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return "";

  const rgb = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+\s*)?\)$/
  );
  if (!rgb) return value;

  const [r, g, b] = rgb.slice(1, 4).map((part) =>
    Math.max(0, Math.min(255, Number(part)))
  );

  return `#${[r, g, b]
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getClosestElement(node: Node | null, root: HTMLElement | null) {
  if (!node || !root) return null;
  if (node instanceof HTMLElement) return node;
  const parent = node.parentElement;
  return parent && root.contains(parent) ? parent : null;
}

function getToolbarStateFromSelection(root: HTMLElement | null): ToolbarState {
  const selection = window.getSelection();
  if (!root || !selection || selection.rangeCount === 0) {
    return { bold: false, color: "" };
  }

  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  if (!anchorNode || !focusNode) {
    return { bold: false, color: "" };
  }

  if (!root.contains(anchorNode) || !root.contains(focusNode)) {
    return { bold: false, color: "" };
  }

  const element = getClosestElement(anchorNode, root);
  if (!element) {
    return { bold: false, color: "" };
  }

  const bold = Boolean(element.closest("strong, b"));
  const colorElement = element.closest<HTMLElement>("[style*='color']");
  const color = normalizeColorValue(colorElement?.style.color);

  return { bold, color };
}

function ToolbarButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onClick}
      className={[
        "inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition-colors",
        active
          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/12 dark:text-blue-200"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/12 dark:bg-white/[0.05] dark:text-white/80 dark:hover:bg-white/[0.08]",
      ].join(" ")}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function Toolbar({
  colors,
  colorLabel,
  boldLabel,
  clearColorLabel,
  state,
  onToggleBold,
  onApplyColor,
  onClearColor,
}: {
  colors: Array<{ value: string; label: string }>;
  colorLabel: string;
  boldLabel: string;
  clearColorLabel: string;
  state: ToolbarState;
  onToggleBold: () => void;
  onApplyColor: (color: string) => void;
  onClearColor: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ToolbarButton active={state.bold} label={boldLabel} onClick={onToggleBold}>
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        active={!state.color}
        label={clearColorLabel}
        onClick={onClearColor}
      >
        <span className="text-xs">{clearColorLabel}</span>
      </ToolbarButton>
      <span className="ml-1 text-[11px] font-medium text-slate-500 dark:text-white/50">
        {colorLabel}
      </span>
      {colors.map((color) => {
        const active = state.color === color.value.toLowerCase();
        return (
          <button
            key={color.value}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => onApplyColor(color.value)}
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-transform",
              active
                ? "scale-105 border-slate-900 shadow-sm dark:border-white"
                : "border-slate-300 dark:border-white/12",
            ].join(" ")}
            style={{ backgroundColor: color.value }}
            aria-label={`${colorLabel}: ${color.label}`}
            title={color.label}
          >
            {active ? (
              <Icon
                icon="mdi:check"
                className="h-4 w-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default function NodeRichTextDialog({
  open,
  onOpenChange,
  title,
  description: _description,
  plainTopicLabel,
  plainTopicValue,
  initialHtml,
  colors,
  colorLabel,
  boldLabel,
  clearColorLabel,
  resetLabel,
  cancelLabel,
  saveLabel,
  onSave,
}: NodeRichTextDialogProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const descriptionId = useId();
  const [editorHtml, setEditorHtml] = useState("<p></p>");
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    bold: false,
    color: "",
  });

  const initialEditorHtml = useMemo(() => {
    const trimmed = initialHtml.trim();
    if (trimmed) return trimmed;
    const plain = plainTopicValue.trim();
    if (!plain) return "<p></p>";
    return `<p>${escapeHtml(plain).replace(/\r?\n/g, "<br>")}</p>`;
  }, [initialHtml, plainTopicValue]);

  const updateToolbarState = useCallback(() => {
    setToolbarState(getToolbarStateFromSelection(editorRef.current));
  }, []);

  const captureSelectionRange = useCallback(() => {
    const root = editorRef.current;
    const selection = window.getSelection();
    if (!root || !selection || selection.rangeCount === 0) {
      selectionRangeRef.current = null;
      return;
    }

    const range = selection.getRangeAt(0);
    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    if (
      !anchorNode ||
      !focusNode ||
      !root.contains(anchorNode) ||
      !root.contains(focusNode) ||
      range.collapsed
    ) {
      selectionRangeRef.current = null;
      return;
    }

    selectionRangeRef.current = range.cloneRange();
  }, []);

  const resetEditorHtml = useCallback(() => {
    setEditorHtml(initialEditorHtml);
    setToolbarState({ bold: false, color: "" });
  }, [initialEditorHtml]);

  useEffect(() => {
    if (!open) return;
    resetEditorHtml();
    selectionRangeRef.current = null;
  }, [open, resetEditorHtml]);

  const getActiveRange = useCallback(() => {
    const root = editorRef.current;
    const selection = window.getSelection();
    const storedRange = selectionRangeRef.current;
    if (!root || !selection || !storedRange) return null;

    return { range: storedRange.cloneRange(), selection, root };
  }, []);

  const applyInlineWrapper = useCallback(
    (buildWrapper: () => HTMLElement) => {
      const active = getActiveRange();
      if (!active) return;

      const { range, selection, root } = active;
      const wrapper = buildWrapper();
      const fragment = range.extractContents();

      if (!fragment.textContent?.trim()) {
        selection.removeAllRanges();
        return;
      }

      wrapper.appendChild(fragment);
      range.insertNode(wrapper);

      const nextRange = document.createRange();
      nextRange.selectNodeContents(wrapper);
      selection.removeAllRanges();
      selection.addRange(nextRange);
      selectionRangeRef.current = nextRange.cloneRange();

      setEditorHtml(root.innerHTML);
      updateToolbarState();
    },
    [getActiveRange, updateToolbarState]
  );

  const handleToggleBold = useCallback(() => {
    applyInlineWrapper(() => document.createElement("strong"));
  }, [applyInlineWrapper]);

  const handleApplyColor = useCallback(
    (color: string) => {
      applyInlineWrapper(() => {
        const wrapper = document.createElement("span");
        wrapper.style.color = color;
        return wrapper;
      });
    },
    [applyInlineWrapper]
  );

  const handleClearColor = useCallback(() => {
    applyInlineWrapper(() => {
      const wrapper = document.createElement("span");
      wrapper.style.color = "#111827";
      return wrapper;
    });
  }, [applyInlineWrapper]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px]" aria-describedby={descriptionId}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-lg font-bold text-blue-700 dark:text-blue-200">
              {title}
            </DialogTitle>
            <DialogDescription
              id={descriptionId}
              className="rounded-xl border border-blue-200/70 bg-blue-50 px-3 py-2 text-sm font-semibold leading-6 text-blue-800 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100"
            >
              원하는 곳을 드래그해서, 굵기와 색상을 변경하세요.
            </DialogDescription>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/45">
              {plainTopicLabel}
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-white/10 dark:bg-[#0f172a]">
              <div className="border-b border-slate-200 bg-slate-100/90 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                <Toolbar
                  colors={colors}
                  colorLabel={colorLabel}
                  boldLabel={boldLabel}
                  clearColorLabel={clearColorLabel}
                  state={toolbarState}
                  onToggleBold={handleToggleBold}
                  onApplyColor={handleApplyColor}
                  onClearColor={handleClearColor}
                />
              </div>
              <div
                ref={editorRef}
                className="min-h-[180px] select-text bg-white px-4 py-3 text-[15px] leading-7 text-slate-900 outline-none dark:bg-[#0f172a] dark:text-white/90"
                dangerouslySetInnerHTML={{ __html: editorHtml }}
                onMouseUp={() => {
                  captureSelectionRange();
                }}
                onTouchEnd={() => {
                  captureSelectionRange();
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={resetEditorHtml}
              className="rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/12 dark:bg-white/[0.05] dark:text-white/75 dark:hover:bg-white/[0.08]"
            >
              {resetLabel}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/12 dark:bg-white/[0.05] dark:text-white/75 dark:hover:bg-white/[0.08]"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => onSave(editorHtml)}
              className="rounded-2xl bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {saveLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
