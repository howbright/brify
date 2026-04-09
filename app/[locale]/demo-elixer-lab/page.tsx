"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import RawMindElixirLab from "@/components/RawMindElixirLab";

const ClientMindElixir = dynamic(() => import("@/components/ClientMindElixir"), {
  ssr: false,
});

export default function DemoElixerLabPage() {
  const [mode, setMode] = useState<"custom" | "raw">("custom");

  return (
    <div className="h-screen space-y-3 p-4">
      <h1 className="text-xl font-semibold">MindElixir Isolation Lab</h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`rounded px-3 py-1 text-sm ${
            mode === "custom" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-800"
          }`}
        >
          Custom ClientMindElixir
        </button>
        <button
          type="button"
          onClick={() => setMode("raw")}
          className={`rounded px-3 py-1 text-sm ${
            mode === "raw" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-800"
          }`}
        >
          Raw MindElixir
        </button>
      </div>
      <p className="text-sm text-slate-600">
        Compare edit behavior with the same gestures. Check `window.__ME_DEBUG_EVENTS` for
        `H30` (raw) vs existing `H*` logs (custom).
      </p>
      {mode === "custom" ? (
        <div className="h-[78vh]">
          <ClientMindElixir
            mode="light"
            openMenuOnClick={false}
            disableDirectContextMenu
            showSelectionContextMenuButton
          />
        </div>
      ) : (
        <RawMindElixirLab />
      )}
    </div>
  );
}

