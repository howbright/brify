// app/api/status/text/[summaryId]/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic"; // 🔒 Supabase 사용 시 권장

export async function GET(
  req: Request,
  context: { params: Promise<{ summaryId: string }> }
) {
  const { summaryId } = await context.params;

  if (!summaryId) {
    return NextResponse.json({ error: "요약 ID가 필요합니다." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("summaries")
    .select("status, detailed_summary_text, error_message")
    .eq("id", summaryId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "요약을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const { status, detailed_summary_text, error_message } = data;

  // 상태 로직 결정
  let effectiveStatus: "pending" | "partial" | "completed" | "failed" = "pending";

  if (status === "failed") {
    effectiveStatus = "failed";
  } else if (detailed_summary_text) {
    effectiveStatus = status === "completed" ? "completed" : "partial";
  }

  return NextResponse.json({
    status: effectiveStatus,
    detailedSummaryText: detailed_summary_text,
    errorMessage: error_message || null,
  });
}
