// app/api/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

function isReactFlow(v: any) {
  return v && typeof v === "object" && Array.isArray(v.nodes) && Array.isArray(v.edges);
}
function isOriginalArray(v: any) {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && "id" in v[0];
}
function isOriginalObject(v: any) {
  return v && typeof v === "object" && v.type === "original" && Array.isArray(v.nodes);
}

// 간단 레이아웃: depth/순서 기반으로 좌표 배치
function originalToReactFlow(original: any): { version: 1; type: "reactflow"; nodes: any[]; edges: any[] } {
  const items = isOriginalObject(original) ? original.nodes : (isOriginalArray(original) ? original : []);
  if (!Array.isArray(items) || items.length === 0) {
    return { version: 1, type: "reactflow", nodes: [], edges: [] };
  }

  // id -> item 맵
  const map = new Map(items.map((n: any) => [n.id, n]));
  // child 집합
  const childSet = new Set<string>();
  items.forEach((n: any) => (n.children || []).forEach((cid: string) => childSet.add(cid)));
  // 루트 목록
  const roots = items.filter((n: any) => !childSet.has(n.id));

  // BFS로 depth 계산 + 레벨별 순서
  const depth = new Map<string, number>();
  const order = new Map<string, number>();
  const levels: string[][] = [];

  const queue: string[] = roots.map((r: any) => r.id);
  roots.forEach((r: any, idx: number) => {
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

  // 좌표 배치
  const X_STEP = 260;
  const Y_STEP = 160;

  const nodes = items.map((n: any) => {
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
        label: n.title || n.description || "", // 기본 label 보강
      },
    };
  });

  const edges: any[] = [];
  items.forEach((n: any) => {
    (n.children || []).forEach((cid: string) => {
      if (!map.has(cid)) return;
      edges.push({
        id: `e-${n.id}-${cid}`,
        source: n.id,
        target: cid,
      });
    });
  });

  return { version: 1, type: "reactflow", nodes, edges };
}

function toReactFlowState(raw: any) {
  if (!raw) return null;
  if (isReactFlow(raw)) {
    // type/version 누락 시 보강
    return {
      version: raw.version ?? 1,
      type: raw.type ?? "reactflow",
      nodes: raw.nodes,
      edges: raw.edges,
    };
  }
  // 흔한 케이스: { nodes, edges } 객체인데 type/version 없음
  if (raw && Array.isArray(raw.nodes) && Array.isArray(raw.edges)) {
    return { version: 1, type: "reactflow", nodes: raw.nodes, edges: raw.edges };
  }
  return null;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "요약 ID가 필요합니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("summaries")
    .select(`
      id, user_id, created_at, source_type, source_title, source_url,
      summary_text, detailed_summary_text, diagram_json, temp_diagram_json,
      status, lang, is_public, updated_at, category,
      summary_keywords(
        keyword:keywords(id, name, lang)
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("❌ Supabase 에러:", error);
    return NextResponse.json({ error: "요약을 불러오지 못했습니다." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "요약을 찾을 수 없습니다." }, { status: 404 });
  }

  // 키워드 평탄화
  const keywords =
    data.summary_keywords?.map((k: any) => ({
      id: k?.keyword?.id,
      name: k?.keyword?.name,
      lang: k?.keyword?.lang,
    }))?.filter(Boolean) ?? [];

  // 1) temp(편집본) → reactflow 스냅샷으로 강제
  const overlayRF = toReactFlowState(data.temp_diagram_json);

  // 2) original(원본 트리) → reactflow로 변환
  const originalRF = originalToReactFlow(data.diagram_json ?? data.diagram_json);

  // 3) 우선순위: overlayRF(nodes>0) > originalRF(nodes>0) > 빈 값
  const effective =
    (overlayRF && overlayRF.nodes?.length ? overlayRF : null) ??
    (originalRF && originalRF.nodes?.length ? originalRF : null) ??
    { version: 1, type: "reactflow", nodes: [], edges: [] };

  const diagram_source =
    overlayRF && overlayRF.nodes?.length ? "overlay" :
    originalRF && originalRF.nodes?.length ? "original" : "none";

  const result = {
    ...data,
    keywords,
    // 참고용(원본은 그대로 유지)
    original_diagram_json: data.diagram_json ?? null,
    temp_diagram_json: overlayRF, // reactflow로 강제
    effective_diagram_json: effective, // ✅ 항상 reactflow
    diagram_source,
  };

  delete (result as any).summary_keywords;

  const res = NextResponse.json(result);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
