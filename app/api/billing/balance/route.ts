// app/api/billing/balance/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("credits_paid, credits_free")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("Failed to load credits:", error?.message);
    return NextResponse.json(
      { error: "Failed to load balance" },
      { status: 500 }
    );
  }

  const paidRaw = Number(profile.credits_paid ?? 0);
  const free = Number(profile.credits_free ?? 0);

  const { data: lots, error: lotsError } = await supabase
    .from("credit_lots")
    .select("remaining_credits, expires_at, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gt("remaining_credits", 0)
    .gt("expires_at", new Date().toISOString());

  if (lotsError) {
    console.error("Failed to load usable paid credits:", lotsError.message);
    return NextResponse.json(
      { error: "Failed to load usable paid credits" },
      { status: 500 }
    );
  }

  const paid = (lots ?? []).reduce(
    (sum, lot) => sum + Number(lot.remaining_credits ?? 0),
    0
  );
  const total = free + paid;

  return NextResponse.json({
    total,
    paid,
    free,
    paidRaw,
  });
}
