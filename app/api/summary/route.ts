import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url); // ✅ 쿼리 파라미터 추출
  const id = searchParams.get("id");

  console.log("서버 함수 호출, id:", id);

  if (!id) {
    return NextResponse.json(
      { error: "요약 ID가 필요합니다." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  console.log("supabase 클라이언트 생성");

//   const {
//     data: { user },
//     error: sessionError,
//   } = await supabase.auth.getUser();

//   if (sessionError || !user) {
//     return NextResponse.json(
//       { error: "로그인이 필요합니다." },
//       { status: 401 }
//     );
//   }

  console.log("세션점검");
  const { data, error } = await supabase
    .from("summaries")
    .select(
      `id, user_id, created_at, source_type, source_title, source_url,
       summary_text, detailed_summary_text,
       diagram_json, status, lang, is_public, updated_at`
    )
    .eq("id", id)
    .single();

    console.log("data: ", data)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "요약을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

//   if (data.user_id !== user.id) {
//     return NextResponse.json(
//       { error: "접근 권한이 없습니다." },
//       { status: 403 }
//     );
//   }

  return NextResponse.json(data);
}


export async function DELETE(req: NextRequest) {
    const { id } = await req.json();
  
    if (!id) {
      return NextResponse.json(
        { error: "삭제할 ID가 필요합니다." },
        { status: 400 }
      );
    }
  
    const supabase = await createClient();
    const { error } = await supabase.from("summaries").delete().eq("id", id);
  
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  
    return NextResponse.json({ message: "삭제 완료" });
  }
  