import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: '요약 ID가 필요합니다.' }, { status: 400 });
  }

  // 🔐 현재 로그인된 유저 확인
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 🔍 요약 데이터 조회 (user_id도 포함)
  const { data, error } = await supabase
    .from('summaries')
    .select(
      `id, user_id, created_at, source_type, source_title, source_url,
       original_text, summary_text, detailed_summary_text,
       diagram_json, status, lang, is_public`
    )
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '요약을 찾을 수 없습니다.' }, { status: 404 });
  }

  // 🔐 로그인된 유저가 작성한 요약이 아니면 접근 금지
  if (data.user_id !== user.id) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  return NextResponse.json(data);
}
