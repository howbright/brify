// app/api/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { originalToReactFlow } from "@/app/lib/diagram/reactflow-auto-layout";
import { toReactFlowState } from "./util";

// 이 라우트를 항상 동적으로 처리 (정적 캐싱 방지)
export const dynamic = "force-dynamic";

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

  // 2) original(원본 트리) → reactflow로 변환 (정식 변환기 사용)
  const originalRF = await originalToReactFlow(data.diagram_json ?? undefined);

  // 3) 우선순위: overlayRF(nodes>0) > originalRF(nodes>0) > 빈 값
  const effective =
    (overlayRF && overlayRF.nodes?.length ? overlayRF : null) ??
    (originalRF && originalRF.nodes?.length ? originalRF : null) ??
    { version: 1, type: "reactflow", nodes: [], edges: [] };

  const diagram_source =
    overlayRF && overlayRF.nodes?.length ? "overlay" :
    originalRF && originalRF.nodes?.length ? "original" : "none";

  const result: any = {
    ...data,
    keywords,
    // 참고용(원본은 그대로 유지)
    original_diagram_json: data.diagram_json ?? null,
    temp_diagram_json: overlayRF,          // ✅ 항상 reactflow
    effective_diagram_json: effective,     // ✅ 항상 reactflow
    diagram_source,
  };
  delete result.summary_keywords;

  const res = NextResponse.json(result);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
