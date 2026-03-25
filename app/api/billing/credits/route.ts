import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { adminSupabase } from "@/utils/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: profile, error: profileError }, { data: transactions, error: txError }] =
    await Promise.all([
      adminSupabase
        .from("profiles")
        .select("credits_paid, credits_free")
        .eq("id", user.id)
        .single(),
      adminSupabase
        .from("credit_transactions")
        .select(
          "id, created_at, delta_total, delta_paid, delta_free, balance_total_after, balance_paid_after, balance_free_after, source, tx_type, reason"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }

  if (txError) {
    return NextResponse.json(
      { error: "Failed to load credit history" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    summary: {
      currentPaid: profile.credits_paid ?? 0,
      currentFree: profile.credits_free ?? 0,
      currentTotal: (profile.credits_paid ?? 0) + (profile.credits_free ?? 0),
    },
    transactions: transactions ?? [],
  });
}
