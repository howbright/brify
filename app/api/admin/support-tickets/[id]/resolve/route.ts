import { NextResponse } from "next/server";
import { requireBlogAdmin } from "@/app/api/admin/blog/_auth";
import { adminSupabase } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireBlogAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: admin.status });
  }

  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    return NextResponse.json({ error: "invalid_ticket_id" }, { status: 400 });
  }

  const { data, error } = await adminSupabase
    .from("support_tickets")
    .update({
      status: "resolved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .select("id,status,updated_at")
    .single();

  if (error) {
    console.error("[admin/support-tickets/resolve] update failed", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ticket: data });
}
