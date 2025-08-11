import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    // temp_diagram_json → diagram_json 복사
    const { data, error: fetchError } = await supabase
      .from("summaries")
      .select("temp_diagram_json")
      .eq("id", params.id)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from("summaries")
      .update({
        diagram_json: data.temp_diagram_json,
        temp_diagram_json: data.temp_diagram_json, // temp도 동기화해 둠
      })
      .eq("id", params.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
