import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { adminSupabase } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reservationId = cleanString(id);
  if (!reservationId) {
    return NextResponse.json({ error: "RESERVATION_ID_REQUIRED" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = adminSupabase as any;
  const { data, error } = await db
    .from("youtube_reservations")
    .select(
      "id,url,video_id,output_language,status,status_reason,required_credits,charged_credits,result_map_id,processed_at,created_at,updated_at"
    )
    .eq("id", reservationId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ reservation: data });
}
