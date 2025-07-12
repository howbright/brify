import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  console.log('📥 API 호출됨');

  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: '요약 ID가 필요합니다.' }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('summaries')
    .select(
      `id, user_id, created_at, source_type, source_title, source_url,
       summary_text, detailed_summary_text, diagram_json, status, lang, is_public, updated_at`
    )
    .eq('id', id)
    .eq('user_id', "5fd89f5f-8bda-4a62-8110-152fd3b4133d") // 🔒 자신이 소유한 요약만 조회
    .single();

  if (error) {
    console.error('❌ Supabase 에러:', error);
    return NextResponse.json({ error: '요약을 불러오지 못했습니다.' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// export async function GET(req: NextRequest){

//   console.log("서버 함수 호출");
//   const { searchParams } = new URL(req.url); // ✅ 쿼리 파라미터 추출
//   const id = searchParams.get("id");

//   console.log("서버 함수 호출, id:", id);

//   if (!id) {
//     return NextResponse.json(
//       { error: "요약 ID가 필요합니다." },
//       { status: 400 }
//     );
//   } 
//   else {
    
//   }

//   const supabase = await createClient();
//   console.log("supabase 클라이언트 생성", id);

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

//   return NextResponse.json({ id : id})

//   console.log("세션점검");
//   const { data, error } = await supabase
//     .from("summaries")
//     .select(
//       `id, user_id, created_at, source_type, source_title, source_url,
//        summary_text, detailed_summary_text,
//        diagram_json, status, lang, is_public, updated_at`
//     )
//     .eq("id", id)
//     .single();

//     console.log("data: ", data)

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }

//   if (!data) {
//     return NextResponse.json(
//       { error: "요약을 찾을 수 없습니다." },
//       { status: 404 }
//     );
//   }

// //   if (data.user_id !== user.id) {
// //     return NextResponse.json(
// //       { error: "접근 권한이 없습니다." },
// //       { status: 403 }
// //     );
// //   }

//   return NextResponse.json(data);
// }


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
  