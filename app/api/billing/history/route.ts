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

  const [{ data: profile, error: profileError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      adminSupabase
        .from("profiles")
        .select("credits_paid, credits_free")
        .eq("id", user.id)
        .single(),
      adminSupabase
        .from("payments")
        .select(
          "id, created_at, amount, credits, currency, status, provider, receipt_url, provider_order_id"
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

  if (paymentsError) {
    return NextResponse.json(
      { error: "Failed to load payment history" },
      { status: 500 }
    );
  }

  const paid = profile.credits_paid ?? 0;
  const free = profile.credits_free ?? 0;
  const currentBalance = paid + free;
  const totalChargedCredits = (payments ?? [])
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + (payment.credits ?? 0), 0);

  return NextResponse.json({
    summary: {
      totalChargedCredits,
      currentBalance,
      currentPaidBalance: paid,
      usedCredits: Math.max(totalChargedCredits - paid, 0),
    },
    payments: payments ?? [],
  });
}
