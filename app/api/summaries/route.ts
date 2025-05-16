// app/api/summaries/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/types/database.types';

export async function GET(req: NextRequest) {
  const supabase = await createClient(); //
  const userId = req.nextUrl.searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id 필요' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('summaries')
    .select('id, detailed_summary_text, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const typedData = data as Database['public']['Tables']['summaries']['Row'][];

  return NextResponse.json(data);
}
