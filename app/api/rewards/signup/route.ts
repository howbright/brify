// app/api/rewards/signup/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { grantSignupReward } from "@/app/lib/rewards/grantSignupReward";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const userId = user.id;

    const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
    const locale = cookieLocale === "ko" || cookieLocale === "en" ? cookieLocale : undefined;

    const result = await grantSignupReward({ userId, locale, reward: 15 });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, detail: result.detail }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        alreadyGranted: result.alreadyGranted,
        granted: result.granted,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
