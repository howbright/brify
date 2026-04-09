"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from "react";
import { sampled } from "@/app/lib/mind-elixir/sampleData";

function clone<T>(value: T): T {
  try {
    if (typeof structuredClone === "function") return structuredClone(value);
  } catch {
    // fall through
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export default function RawMindElixirLab() {
  const hostRef = useRef<HTMLDivElement>(null);
  const mindRef = useRef<any>(null);
  const debugBlockedRef = useRef(false);
  const runIdRef = useRef(`raw-lab-${Date.now()}`);

  const postAgentLog = (payload: Record<string, unknown>) => {
    if (typeof window !== "undefined") {
      const bag = (
        window as typeof window & { __ME_DEBUG_EVENTS?: Array<Record<string, unknown>> }
      ).__ME_DEBUG_EVENTS;
      if (Array.isArray(bag)) {
        bag.push(payload);
      } else {
        (
          window as typeof window & {
            __ME_DEBUG_EVENTS?: Array<Record<string, unknown>>;
          }
        ).__ME_DEBUG_EVENTS = [payload];
      }
    }
    if (debugBlockedRef.current) {
      console.warn("[ME_DEBUG]", payload);
      return;
    }
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/b44aa14f-cb62-41f5-bd7a-02a25686b9d0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      debugBlockedRef.current = true;
      console.warn("[ME_DEBUG]", payload);
    });
    // #endregion
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    (async () => {
      const mod = await import("mind-elixir");
      if (disposed) return;
      const MindElixir = mod.default;
      const mind = new MindElixir({
        el: host,
        direction: MindElixir.RIGHT,
        draggable: true,
        editable: true,
        contextMenu: true,
        toolBar: false,
      }) as any;
      const seed = clone(sampled);
      mind.init(seed);
      mindRef.current = mind;

      // #region agent log
      postAgentLog({
        runId: runIdRef.current,
        hypothesisId: "H30",
        location: "components/RawMindElixirLab.tsx:init",
        message: "raw mind elixir initialized",
        data: {
          hasMind: Boolean(mindRef.current),
        },
        timestamp: Date.now(),
      });
      // #endregion

      mind.bus?.addListener?.("operation", (op: any) => {
        if (!["beginEdit", "finishEdit", "selectNode", "unselectNodes"].includes(op?.name)) {
          return;
        }
        // #region agent log
        postAgentLog({
          runId: runIdRef.current,
          hypothesisId: "H30",
          location: "components/RawMindElixirLab.tsx:operation",
          message: "raw operation",
          data: {
            opName: op?.name ?? "unknown",
            opId: op?.id ?? op?.data?.id ?? op?.obj?.id ?? null,
          },
          timestamp: Date.now(),
        });
        // #endregion
      });
    })();

    return () => {
      disposed = true;
      try {
        mindRef.current?.destroy?.();
      } catch {
        // ignore
      }
      mindRef.current = null;
    };
  }, []);

  return <div ref={hostRef} className="h-[70vh] w-full rounded border border-slate-300" />;
}

