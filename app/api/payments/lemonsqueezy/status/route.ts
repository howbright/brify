import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const packId = searchParams.get("pack")?.trim() ?? "";
  const startedAt = Number(searchParams.get("started_at") ?? "");

  if (!packId || !Number.isFinite(startedAt) || startedAt <= 0) {
    return NextResponse.json(
      { error: "pack and started_at are required" },
      { status: 400 }
    );
  }

  const startedAtIso = new Date(startedAt).toISOString();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits_paid, credits_free")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Failed to load profile while checking Lemon payment:", profileError?.message);
    return NextResponse.json(
      { error: "Failed to load balance" },
      { status: 500 }
    );
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, status, credits, created_at, provider_order_id")
    .eq("user_id", user.id)
    .eq("provider", "lemon_squeezy")
    .eq("credit_pack_id", packId)
    .eq("status", "paid")
    .gte("created_at", startedAtIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError) {
    console.error("Failed to check Lemon payment status:", paymentError.message);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }

  const paid = profile.credits_paid ?? 0;
  const free = profile.credits_free ?? 0;

  return NextResponse.json({
    status: payment ? "paid" : "pending",
    payment,
    balance: {
      total: paid + free,
      paid,
      free,
    },
  });
}
