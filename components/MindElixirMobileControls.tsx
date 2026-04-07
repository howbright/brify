"use client";

import { Icon } from "@iconify/react";

type Labels = {
  addChild: string;
  addSibling: string;
  rename: string;
  remove: string;
};

type Props = {
  showActionBar: boolean;
  labels: Labels;
  title?: string;
  disableAddSibling?: boolean;
  disableRename?: boolean;
  disableRemove?: boolean;
  onClose?: () => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onRename: () => void;
  onRemove: () => void;
};

export default function MindElixirMobileControls({
  showActionBar,
  labels,
  title = "Edit menu",
  disableAddSibling = false,
  disableRename = false,
  disableRemove = false,
  onClose,
  onAddChild,
  onAddSibling,
  onRename,
  onRemove,
}: Props) {
  const baseItemClassName =
    "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-semibold transition-colors";
  const emitActionLog = (action: string, disabled: boolean) => {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/b44aa14f-cb62-41f5-bd7a-02a25686b9d0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: "mobile-controls",
        hypothesisId: "H7",
        location: "components/MindElixirMobileControls.tsx:42",
        message: "mobile sheet action button pressed",
        data: { action, disabled, showActionBar },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  };

  return (
    <>
      {showActionBar && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
          <button
            type="button"
            aria-label="Close menu"
            className="pointer-events-auto absolute inset-0 bg-black/18"
            onClick={onClose}
          />
          <div className="pointer-events-auto relative mx-auto w-full max-w-md rounded-t-[28px] border border-b-0 border-neutral-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_44px_-28px_rgba(15,23,42,0.38)]">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-300" />
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="text-[13px] font-medium text-neutral-500">
                {title}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Close menu"
              >
                <Icon icon="mdi:close" className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                emitActionLog("addChild", false);
                onAddChild();
              }}
              className={`${baseItemClassName} bg-neutral-50 text-neutral-950 hover:bg-neutral-100`}
            >
              <span className="inline-flex items-center gap-3">
                <Icon
                  icon="mdi:plus-circle-outline"
                  className="h-5 w-5 shrink-0 text-neutral-700"
                />
                <span>{labels.addChild}</span>
              </span>
              <Icon
                icon="mdi:chevron-right"
                className="h-5 w-5 shrink-0 text-neutral-400"
              />
            </button>
            <button
              type="button"
              onClick={() => {
                emitActionLog("addSibling", disableAddSibling);
                onAddSibling();
              }}
              disabled={disableAddSibling}
              className={[
                baseItemClassName,
                disableAddSibling
                  ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
                  : "bg-neutral-50 text-neutral-950 hover:bg-neutral-100",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-3">
                <Icon
                  icon="mdi:graph-outline"
                  className={[
                    "h-5 w-5 shrink-0",
                    disableAddSibling ? "text-neutral-400" : "text-neutral-700",
                  ].join(" ")}
                />
                <span>{labels.addSibling}</span>
              </span>
              <Icon
                icon="mdi:chevron-right"
                className="h-5 w-5 shrink-0 text-neutral-400"
              />
            </button>
            <button
              type="button"
              onClick={() => {
                emitActionLog("rename", disableRename);
                onRename();
              }}
              disabled={disableRename}
              className={[
                baseItemClassName,
                disableRename
                  ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
                  : "bg-neutral-50 text-neutral-950 hover:bg-neutral-100",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-3">
                <Icon
                  icon="mdi:pencil-outline"
                  className={[
                    "h-5 w-5 shrink-0",
                    disableRename ? "text-neutral-400" : "text-neutral-700",
                  ].join(" ")}
                />
                <span>{labels.rename}</span>
              </span>
              <Icon
                icon="mdi:chevron-right"
                className="h-5 w-5 shrink-0 text-neutral-400"
              />
            </button>
            <button
              type="button"
              onClick={() => {
                emitActionLog("remove", disableRemove);
                onRemove();
              }}
              disabled={disableRemove}
              className={[
                baseItemClassName,
                disableRemove
                  ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
                  : "bg-neutral-50 text-neutral-950 hover:bg-neutral-100",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-3">
                <Icon
                  icon="mdi:trash-can-outline"
                  className={[
                    "h-5 w-5 shrink-0",
                    disableRemove ? "text-neutral-400" : "text-neutral-700",
                  ].join(" ")}
                />
                <span>{labels.remove}</span>
              </span>
              <Icon
                icon="mdi:chevron-right"
                className="h-5 w-5 shrink-0 text-neutral-400"
              />
            </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
