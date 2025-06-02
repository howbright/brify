import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { summaryId, keywords } = await req.json();

  if (!summaryId || !Array.isArray(keywords)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // ✅ 인증 확인
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ 1. 기존 매핑 삭제
  const { error: deleteError } = await supabase
    .from("summary_keywords")
    .delete()
    .eq("summary_id", summaryId);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete old mappings" }, { status: 500 });
  }

  // ✅ 2. 키워드 삽입 및 매핑 처리
  for (const keyword of keywords) {
    let keywordId: number | null = null;

    try {
      // (1) 기존 키워드 검색
      const { data: existing } = await supabase
        .from("keywords")
        .select("id")
        .eq("name", keyword)
        .single();

      if (existing) {
        keywordId = existing.id;
      } else {
        // (2) 없으면 새 키워드 삽입
        const { data: inserted, error: insertError } = await supabase
          .from("keywords")
          .insert({ name: keyword })
          .select()
          .single();

        if (insertError || !inserted) {
          console.error(`Failed to insert keyword '${keyword}'`, insertError);
          continue;
        }

        keywordId = inserted.id;
      }

      // (3) 키워드 ID가 있다면 매핑 테이블에 삽입
      if (keywordId) {
        const { error: mappingError } = await supabase
          .from("summary_keywords")
          .insert({
            summary_id: summaryId,
            keyword_id: keywordId,
          });

        if (mappingError) {
          console.error("Failed to insert keyword mapping", mappingError);
        }
      }
    } catch (err) {
      console.error(`Unexpected error while processing keyword: ${keyword}`, err);
    }
  }

  return NextResponse.json({ success: true });
}
