// app/api/summaries/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const userId = req.nextUrl.searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id 필요' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('summaries')
    .select(`
      id,
      summary_text,
      status,
      created_at,
      summary_keywords(
        keyword:keywords(name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 💡 'summary_keywords'는 array, 그 안에 'keyword.name' 포함됨
  const result = data.map((item) => ({
    id: item.id,
    summary_text: item.summary_text,
    status: item.status,
    created_at: item.created_at,
    tags: item.summary_keywords?.map((sk) => sk.keyword?.name).filter(Boolean) || [],
  }));

  return NextResponse.json(result);
}
