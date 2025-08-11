// app/api/summary/route.ts (or your path)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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

  // temp_diagram_json까지 함께 조회
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

  // 키워드 정리
  const keywords =
    data.summary_keywords?.map((k: any) => ({
      id: k.keyword.id,
      name: k.keyword.name,
      lang: k.keyword.lang,
    })) ?? [];

  // 어떤 다이어그램을 쓸지 결정
  const overlay = data.temp_diagram_json ?? null;
  const original = data.diagram_json ?? null;
  const effective = overlay ?? original; // 편집본 우선

  const result = {
    ...data,
    keywords,
    // 프론트에서 쓰기 좋게 명시적 필드 제공
    original_diagram_json: original,
    temp_diagram_json: overlay,
    effective_diagram_json: effective,
    diagram_source: overlay ? "overlay" : "original" as const,
  };

  // 원본 summary_keywords 필드는 제거
  delete (result as any).summary_keywords;

  return NextResponse.json(result);
}
