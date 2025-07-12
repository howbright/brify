// app/api/summaries/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const userId = req.nextUrl.searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id 필요" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("summaries")
    .select(`
      id,
      summary_text,
      status,
      created_at,
      summary_keywords(
        keyword:keywords(name)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 명시적 타입 선언
  type KeywordRelation = {
    keyword: {
      name: string;
    } | null;
  };
  
  const result = (data || []).map((item) => {
    const keywords = (item.summary_keywords as unknown as KeywordRelation[]) || [];
  
    return {
      id: item.id,
      summary_text: item.summary_text,
      status: item.status,
      created_at: item.created_at,
      tags: keywords
        .map((k) => k.keyword?.name)
        .filter((name): name is string => Boolean(name)),
    };
  });
  

  return NextResponse.json(result);
}
