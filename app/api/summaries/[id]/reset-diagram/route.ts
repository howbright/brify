import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    // diagram_json → temp_diagram_json으로 되돌리기
    const { data, error: fetchError } = await supabase
      .from("summaries")
      .select("diagram_json")
      .eq("id", params.id)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from("summaries")
      .update({ temp_diagram_json: data.diagram_json })
      .eq("id", params.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, diagram_json: data.diagram_json });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
