import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const ids = Array.isArray(body?.ids)
      ? body.ids.map((id: any) => String(id)).filter(Boolean)
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "no_ids" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("maps")
      .delete()
      .in("id", ids)
      .eq("user_id", userData.user.id)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      deleted: Array.isArray(data) ? data.map((row) => row.id) : [],
    });
  } catch (error) {
    console.error("[maps/bulk-delete] failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
