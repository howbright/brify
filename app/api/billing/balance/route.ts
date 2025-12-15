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

  const paid = profile.credits_paid ?? 0;
  const free = profile.credits_free ?? 0;
  const total = paid + free;

  return NextResponse.json({
    total,
    paid,
    free,
  });
}
