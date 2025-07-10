import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest, 
  context: { params: Promise<{ id: string }> } // ✅ 핵심: Promise 명시
) {
  const supabase = await createClient();
  const { id } = await context.params; 

  if (!id) {
    return NextResponse.json({ error: '요약 ID가 필요합니다.' }, { status: 400 });
  }

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('summaries')
    .select(
      `id, user_id, created_at, source_type, source_title, source_url,
       original_text, summary_text, detailed_summary_text,
       diagram_json, status, lang, is_public, updated_at`
    )
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '요약을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (data.user_id !== user.id) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: any) {
  const supabase = await createClient();
  const id = params.id;

  const { error } = await supabase.from('summaries').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: '삭제 완료' });
}
