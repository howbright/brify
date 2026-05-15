"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

const BLOCKED_INPUT_TYPES = new Set([
  "insertText",
  "insertReplacementText",
  "insertLineBreak",
  "insertParagraph",
  "insertFromPaste",
  "insertFromDrop",
  "insertFromYank",
  "deleteByCut",
  "deleteByDrag",
  "deleteContent",
  "deleteContentBackward",
  "deleteContentForward",
  "deleteEntireSoftLine",
  "deleteHardLineBackward",
  "deleteHardLineForward",
  "deleteSoftLineBackward",
  "deleteSoftLineForward",
  "deleteWordBackward",
  "deleteWordForward",
  "historyUndo",
  "historyRedo",
]);

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

function shouldBlockKeyDown(event: KeyboardEvent) {
  if (event.isComposing) return false;

  const key = event.key;
  const lower = key.toLowerCase();
  const hasModifier = event.metaKey || event.ctrlKey || event.altKey;

  if (event.metaKey || event.ctrlKey) {
    if (lower === "a" || lower === "c" || lower === "b") {
      return false;
    }
    if (lower === "z" || lower === "y" || lower === "x" || lower === "v") {
      return true;
    }
  }

  if (
    key === "Backspace" ||
    key === "Delete" ||
    key === "Enter" ||
    key === "Tab"
  ) {
    return true;
  }

  if (hasModifier) return false;

  if (key.length === 1) {
    return true;
  }

  return false;
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
        "inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors",
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
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50/80 p-2 dark:border-white/10 dark:bg-white/[0.04]">
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
      <span className="ml-1 text-xs font-medium text-slate-500 dark:text-white/50">
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
              "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-transform",
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
  description,
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

  const isSelectionInsideEditor = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return false;

    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    if (!anchorNode || !focusNode) return false;
    return editor.contains(anchorNode) && editor.contains(focusNode);
  }, []);

  const updateToolbarState = useCallback(() => {
    if (!isSelectionInsideEditor()) {
      setToolbarState({ bold: false, color: "" });
      return;
    }

    let bold = false;
    let color = "";

    try {
      bold = document.queryCommandState("bold");
    } catch {}

    try {
      color = normalizeColorValue(String(document.queryCommandValue("foreColor") ?? ""));
    } catch {}

    setToolbarState({
      bold,
      color,
    });
  }, [isSelectionInsideEditor]);

  const syncEditorHtml = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const nextHtml = initialEditorHtml.trim() || "<p></p>";
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }

    if (!editor.textContent?.trim() && plainTopicValue.trim()) {
      editor.innerHTML = `<p>${escapeHtml(plainTopicValue).replace(/\r?\n/g, "<br>")}</p>`;
    }

    updateToolbarState();
  }, [initialEditorHtml, plainTopicValue, updateToolbarState]);

  const restoreInitialHtml = useCallback(() => {
    syncEditorHtml();
  }, [syncEditorHtml]);

  const runFormatCommand = useCallback((callback: () => void) => {
    if (!isSelectionInsideEditor()) return;
    callback();
    updateToolbarState();
  }, [isSelectionInsideEditor, updateToolbarState]);

  useLayoutEffect(() => {
    if (!open) return;
    syncEditorHtml();

    queueMicrotask(() => {
      editorRef.current?.focus();
    });
  }, [open, syncEditorHtml]);

  useEffect(() => {
    if (!open) return;
    syncEditorHtml();
  }, [open, syncEditorHtml]);

  useEffect(() => {
    if (!open) return;

    const handleSelectionChange = () => {
      updateToolbarState();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [open, updateToolbarState]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px]">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-blue-700 dark:text-blue-200">
              {title}
            </h3>
            <p className="text-sm leading-6 text-slate-600 dark:text-white/65">
              {description}
            </p>
          </div>

          <Toolbar
            colors={colors}
            colorLabel={colorLabel}
            boldLabel={boldLabel}
            clearColorLabel={clearColorLabel}
            state={toolbarState}
            onToggleBold={() => {
              runFormatCommand(() => {
                document.execCommand("bold");
              });
            }}
            onApplyColor={(color) => {
              runFormatCommand(() => {
                document.execCommand("styleWithCSS", false, "true");
                document.execCommand("foreColor", false, color);
              });
            }}
            onClearColor={() => {
              runFormatCommand(() => {
                document.execCommand("styleWithCSS", false, "true");
                document.execCommand("foreColor", false, "#111827");
              });
            }}
          />

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/45">
              {plainTopicLabel}
            </div>
            <div
              ref={(node) => {
                editorRef.current = node;
                if (node && open) {
                  syncEditorHtml();
                }
              }}
              contentEditable
              suppressContentEditableWarning
              className="min-h-[180px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[15px] leading-7 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60 dark:border-white/10 dark:bg-[#0f172a] dark:text-white/90 dark:focus:border-blue-300 dark:focus:ring-blue-500/30"
              onKeyDown={(event) => {
                if (!shouldBlockKeyDown(event.nativeEvent)) return;
                event.preventDefault();
              }}
              onBeforeInput={(event) => {
                const inputType = String(event.nativeEvent.inputType ?? "");
                if (!BLOCKED_INPUT_TYPES.has(inputType)) return;
                event.preventDefault();
              }}
              onPaste={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
              }}
              onMouseUp={updateToolbarState}
              onKeyUp={updateToolbarState}
            />
            <p className="text-xs leading-5 text-slate-500 dark:text-white/50">
              {description}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={restoreInitialHtml}
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
              onClick={() => onSave(editorRef.current?.innerHTML ?? "")}
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
