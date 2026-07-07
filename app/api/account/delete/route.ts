import { NextResponse } from "next/server";
import { deleteAccountData } from "@/app/lib/admin/deleteAccountData";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: "confirmation_required" }, { status: 400 });
  }

  const userId = user.id;

  try {
    await supabase.auth.signOut({ scope: "local" });
    await deleteAccountData(userId, { deleteAuthUser: true });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[account/delete] failed", {
      userId,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "delete_failed", detail: error instanceof Error ? error.message : null },
      { status: 500 }
    );
  }
}
