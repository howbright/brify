import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

/** ---------- helpers: GET /api/summary 와 동일한 규칙 유지 ---------- */
type RFNode = {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data?: any;
};
type RFEdge = { id: string; source: string; target: string };
type RFState = { version?: number; type?: string; nodes: RFNode[]; edges: RFEdge[] };

function isReactFlow(v: any): v is RFState {
  return v && typeof v === "object" && Array.isArray(v.nodes) && Array.isArray(v.edges);
}
function isOriginalArray(v: any): v is any[] {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && "id" in v[0];
}
function isOriginalObject(v: any): v is { type: "original"; nodes: any[] } {
  return v && typeof v === "object" && v.type === "original" && Array.isArray(v.nodes);
}

// original → reactflow 간단 변환 (GET 라우트와 규칙 일치)
function originalToReactFlow(original: any): RFState {
  const items = isOriginalObject(original) ? original.nodes : (isOriginalArray(original) ? original : []);
  if (!Array.isArray(items) || items.length === 0) {
    return { version: 1, type: "reactflow", nodes: [], edges: [] };
  }

  const map = new Map(items.map((n: any) => [n.id, n]));
  const childSet = new Set<string>();
  items.forEach((n: any) => (n.children || []).forEach((cid: string) => childSet.add(cid)));
  const roots = items.filter((n: any) => !childSet.has(n.id));

  const depth = new Map<string, number>();
  const order = new Map<string, number>();
  const levels: string[][] = [];

  const queue: string[] = roots.map((r: any) => r.id);
  roots.forEach((r: any) => {
    depth.set(r.id, 0);
    if (!levels[0]) levels[0] = [];
    order.set(r.id, levels[0].length);
    levels[0].push(r.id);
  });

  while (queue.length) {
    const pid = queue.shift()!;
    const p = map.get(pid);
    const d = depth.get(pid) ?? 0;
    (p?.children || []).forEach((cid: string) => {
      if (!map.has(cid)) return;
      if (!depth.has(cid)) {
        depth.set(cid, d + 1);
        if (!levels[d + 1]) levels[d + 1] = [];
        order.set(cid, levels[d + 1].length);
        levels[d + 1].push(cid);
        queue.push(cid);
      }
    });
  }

  const X_STEP = 260;
  const Y_STEP = 160;

  const nodes: RFNode[] = items.map((n: any) => {
    const d = depth.get(n.id) ?? 0;
    const k = order.get(n.id) ?? 0;
    return {
      id: n.id,
      type: "custom",
      position: { x: k * X_STEP, y: d * Y_STEP },
      data: {
        nodeType: n.nodeType,
        title: n.title,
        description: n.description,
        label: n.title || n.description || "",
      },
    };
  });

  const edges: RFEdge[] = [];
  items.forEach((n: any) => {
    (n.children || []).forEach((cid: string) => {
      if (!map.has(cid)) return;
      edges.push({ id: `e-${n.id}-${cid}`, source: n.id, target: cid });
    });
  });

  return { version: 1, type: "reactflow", nodes, edges };
}
/** ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    // ✅ 동적 params 대신 바디에서 받기
    const body = await req.json().catch(() => ({}));
    const summaryId = String(body?.summaryId ?? "").trim();
    const nodeId = String(body?.nodeId ?? "").trim();
    const highlighted = body?.highlighted;

    if (!summaryId) {
      return NextResponse.json({ message: "summaryId is required" }, { status: 400 });
    }
    if (!nodeId) {
      return NextResponse.json({ message: "nodeId is required" }, { status: 400 });
    }
    if (typeof highlighted !== "boolean") {
      return NextResponse.json({ message: "highlighted must be boolean" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 1) 현재 요약 로드
    const { data, error } = await supabase
      .from("summaries")
      .select("id, user_id, temp_diagram_json, diagram_json")
      .eq("id", summaryId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    }

    // 2) 기준 RF 스냅샷: temp 우선, 없으면 original 변환
    let rf: RFState;
    if (isReactFlow(data.temp_diagram_json)) {
      const raw = data.temp_diagram_json as RFState;
      rf = {
        version: raw.version ?? 1,
        type: raw.type ?? "reactflow",
        nodes: raw.nodes ?? [],
        edges: raw.edges ?? [],
      };
    } else {
      rf = originalToReactFlow(data.diagram_json ?? null);
    }

    // 3) 노드 찾아 표시값 업데이트
    let found = false;
    const nextNodes = (rf.nodes || []).map((n) => {
      if (String(n.id) !== nodeId) return n;
      found = true;
      const nextData = { ...(n.data ?? {}) };
      if (highlighted) {
        nextData.highlighted = true;
      } else {
        if (typeof nextData.highlighted !== "undefined") delete nextData.highlighted;
      }
      return { ...n, type: n.type ?? "custom", data: nextData };
    });

    if (!found) {
      return NextResponse.json({ message: "Node not found" }, { status: 404 });
    }

    const nextRF: RFState = {
      version: rf.version ?? 1,
      type: "reactflow",
      nodes: nextNodes,
      edges: rf.edges ?? [],
    };

    // 4) temp_diagram_json 업데이트
    const { error: upErr } = await supabase
      .from("summaries")
      .update({ temp_diagram_json: nextRF })
      .eq("id", summaryId)
      .eq("user_id", user.id);

    if (upErr) {
      return NextResponse.json({ message: "Update failed" }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    console.error("[highlight] error:", e);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
