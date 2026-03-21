import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // 로그인 사용자 확인
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 현재 글 가져오기 (내 글인지 확인)
  const { data: current, error: currentError } = await supabase
    .from("summaries")
    .select("id, created_at, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 이전글 (내 글 중 created_at 작은 것)
  const { data: prev } = await supabase
    .from("summaries")
    .select("id")
    .eq("user_id", user.id)
    .lt("created_at", current.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 다음글 (내 글 중 created_at 큰 것)
  const { data: next } = await supabase
    .from("summaries")
    .select("id")
    .eq("user_id", user.id)
    .gt("created_at", current.created_at)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    prevId: prev?.id || null,
    nextId: next?.id || null,
  });
}
