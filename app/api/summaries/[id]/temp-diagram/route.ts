import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request, { params }: { params:  Promise<{ id: string }> }) {
  try {
    const body = await req.json(); // { nodes, edges }
    const supabase = await createClient();
    const { id } = await params;  
    const { error } = await supabase
      .from("summaries")
      .update({ temp_diagram_json: body })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
