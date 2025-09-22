// app/api/summary/reset-diagram/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { originalToReactFlow } from "@/app/lib/diagram/reactflow-auto-layout";

type ResetBody = { summaryId?: string };

// function isOriginalArray(v: any) {
//   return Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && "id" in v[0];
// }
// function isOriginalObject(v: any) {
//   return v && typeof v === "object" && v.type === "original" && Array.isArray(v.nodes);
// }

// 원본(diagram_json) -> ReactFlow 스냅샷으로 변환
// function originalToReactFlow(original: any): { version: 1; type: "reactflow"; nodes: any[]; edges: any[] } {
//   const items = isOriginalObject(original) ? original.nodes : (isOriginalArray(original) ? original : []);
//   if (!Array.isArray(items) || items.length === 0) {
//     return { version: 1, type: "reactflow", nodes: [], edges: [] };
//   }

//   const map = new Map(items.map((n: any) => [n.id, n]));
//   const childSet = new Set<string>();
//   items.forEach((n: any) => (n.children || []).forEach((cid: string) => childSet.add(cid)));
//   const roots = items.filter((n: any) => !childSet.has(n.id));

//   const depth = new Map<string, number>();
//   const order = new Map<string, number>();
//   const levels: string[][] = [];

//   const queue: string[] = roots.map((r: any) => r.id);
//   roots.forEach((r: any) => {
//     depth.set(r.id, 0);
//     if (!levels[0]) levels[0] = [];
//     order.set(r.id, levels[0].length);
//     levels[0].push(r.id);
//   });

//   while (queue.length) {
//     const pid = queue.shift()!;
//     const p = map.get(pid);
//     const d = depth.get(pid) ?? 0;
//     (p?.children || []).forEach((cid: string) => {
//       if (!map.has(cid)) return;
//       if (!depth.has(cid)) {
//         depth.set(cid, d + 1);
//         if (!levels[d + 1]) levels[d + 1] = [];
//         order.set(cid, levels[d + 1].length);
//         levels[d + 1].push(cid);
//         queue.push(cid);
//       }
//     });
//   }

//   const X_STEP = 260;
//   const Y_STEP = 160;

//   const nodes = items.map((n: any) => {
//     const d = depth.get(n.id) ?? 0;
//     const k = order.get(n.id) ?? 0;
//     return {
//       id: String(n.id),
//       type: "custom",
//       position: { x: k * X_STEP, y: d * Y_STEP },
//       data: {
//         nodeType: n.nodeType,
//         title: n.title,
//         description: n.description,
//         label: n.title || n.description || "",
//       },
//     };
//   });

//   const edges: any[] = [];
//   items.forEach((n: any) => {
//     (n.children || []).forEach((cid: string) => {
//       if (!map.has(cid)) return;
//       edges.push({
//         id: `e-${n.id}-${cid}`,
//         source: String(n.id),
//         target: String(cid),
//       });
//     });
//   });

//   return { version: 1, type: "reactflow", nodes, edges };
// }

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ message: "Auth error", detail: authError.message }, { status: 401 });
  }
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: ResetBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const summaryId = body?.summaryId;
  if (!summaryId) {
    return NextResponse.json({ message: "summaryId is required" }, { status: 400 });
  }

  // 1) temp_diagram_json NULL 처리
  const { error: updErr } = await supabase
    .from("summaries")
    .update({ temp_diagram_json: null })
    .eq("id", summaryId)
    .eq("user_id", user.id);

  if (updErr) {
    return NextResponse.json({ message: "Reset failed", detail: updErr.message }, { status: 500 });
  }

  // 2) 원본 diagram_json 다시 읽어서 ReactFlow 형태로 변환
  const { data, error } = await supabase
    .from("summaries")
    .select("diagram_json")
    .eq("id", summaryId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ message: "Not found", detail: error?.message }, { status: 404 });
  }

  const effective_diagram_json = await originalToReactFlow(data.diagram_json ?? null);

  return NextResponse.json({
    effective_diagram_json, // ← 클라이언트는 이걸 바로 그리면 됨
  });
}
