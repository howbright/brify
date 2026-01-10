// app/api/rewards/signup/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { grantSignupReward } from "@/app/lib/rewards/grantSignupReward";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const userId = session.user.id;

    // locale은 쿠키나 프로필 기반으로 넣어도 되고, 일단 cookie 기준으로
    // (원하면 profiles.locale 읽어오는 걸로 바꿔도 됨)
    const locale = "ko"; // 필요하면 req cookies 기반으로 변경(현재 POST()는 req가 없어서 고정/또는 createClient에서 읽기)

    const result = await grantSignupReward({ userId, locale, reward: 10 });

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
