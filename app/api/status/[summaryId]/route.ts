import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 동적 렌더링 선언

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ summaryId: string }> }
) {
  const { summaryId } = await context.params;

  const supabase = await createClient();

  if (!summaryId) {
    return NextResponse.json({ error: 'summaryId가 필요합니다.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('summaries')
    .select('status, summary_text, detailed_summary_text, diagram_json, error_message')
    .eq('id', summaryId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '해당 요약을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({
    status: data.status,
    summaryText: data.summary_text,
    detailedSummaryText: data.detailed_summary_text,
    treeSummary: data.diagram_json,
    errorMessage: data.error_message,
  });
}
