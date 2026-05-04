import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type BlankMapBody = {
  title?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as BlankMapBody | null;
    const title = String(body?.title ?? "").trim() || "Untitled";

    const mind = {
      nodeData: {
        id: crypto.randomUUID(),
        topic: title,
        root: true,
        expanded: true,
        children: [],
      },
    };

    const { data, error } = await supabase
      .from("maps")
      .insert({
        title,
        user_id: userData.user.id,
        source_type: "manual",
        map_status: "done",
        schema_version: 1,
        required_credits: 0,
        credits_charged: 0,
        source_char_count: 0,
        tags: [],
        description: "",
        mind_elixir: mind,
        mind_elixir_draft: mind,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("[maps/blank] failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

