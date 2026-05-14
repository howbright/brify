"use client";

import { useEffect, useMemo } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import HardBreak from "@tiptap/extension-hard-break";
import TextStyle from "@tiptap/extension-text-style";
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

const TextColor = Extension.create({
  name: "textColor",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          color: {
            default: null,
            parseHTML: (element) =>
              (element as HTMLElement).style.color || null,
            renderHTML: (attributes) => {
              if (!attributes.color) return {};
              return {
                style: `color: ${attributes.color}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setTextColor:
        (color: string) =>
        ({ chain }: { chain: () => any }) =>
          chain().setMark("textStyle", { color }).run(),
      unsetTextColor:
        () =>
        ({ chain }: { chain: () => any }) =>
          chain().setMark("textStyle", { color: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

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

function Toolbar({ editor, colors, colorLabel, boldLabel, clearColorLabel }: {
  editor: Editor | null;
  colors: Array<{ value: string; label: string }>;
  colorLabel: string;
  boldLabel: string;
  clearColorLabel: string;
}) {
  if (!editor) return null;
  const currentColor = String(editor.getAttributes("textStyle")?.color ?? "").toLowerCase();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50/80 p-2 dark:border-white/10 dark:bg-white/[0.04]">
      <ToolbarButton
        active={editor.isActive("bold")}
        label={boldLabel}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        active={!currentColor}
        label={clearColorLabel}
        onClick={() => (editor.commands as any).unsetTextColor?.()}
      >
        <span className="text-xs">{clearColorLabel}</span>
      </ToolbarButton>
      <span className="ml-1 text-xs font-medium text-slate-500 dark:text-white/50">
        {colorLabel}
      </span>
      {colors.map((color) => {
        const active = currentColor === color.value.toLowerCase();
        return (
          <button
            key={color.value}
            type="button"
            onClick={() => (editor.commands as any).setTextColor?.(color.value)}
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
  const editorExtensions = useMemo(
    () =>
      [
        Document,
        Paragraph,
        Text,
        Bold,
        HardBreak,
        TextStyle,
        TextColor,
      ],
    []
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: editorExtensions,
      content: initialHtml,
      editorProps: {
        attributes: {
          class:
            "min-h-[180px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[15px] leading-7 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60 dark:border-white/10 dark:bg-[#0f172a] dark:text-white/90 dark:focus:border-blue-300 dark:focus:ring-blue-500/30",
        },
      },
    } as any,
    [editorExtensions, initialHtml]
  );

  useEffect(() => {
    if (!editor || !open) return;
    editor.commands.setContent(initialHtml, false);
    queueMicrotask(() => {
      editor.commands.focus("end");
    });
  }, [editor, initialHtml, open]);

  const plainSummary = plainTopicValue.trim() || "-";

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

          <div className="rounded-2xl border border-slate-300/90 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/45">
              {plainTopicLabel}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-white/75">
              {plainSummary}
            </p>
          </div>

          <Toolbar
            editor={editor}
            colors={colors}
            colorLabel={colorLabel}
            boldLabel={boldLabel}
            clearColorLabel={clearColorLabel}
          />

          <div className="space-y-2">
            <EditorContent editor={editor} />
            <p className="text-xs leading-5 text-slate-500 dark:text-white/50">
              {description}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => editor?.commands.setContent(initialHtml, false)}
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
              onClick={() => onSave(editor?.getHTML() ?? "")}
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
