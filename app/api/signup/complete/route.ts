// app/api/signup/complete/route.ts
import { grantSignupReward } from "@/app/lib/rewards/grantSignupReward";
import { adminSupabase } from "@/utils/supabase/admin";
import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";

function signSignup(uid: string, next: string) {
  const secret = process.env.SIGNUP_COMPLETE_SECRET!;
  return crypto
    .createHmac("sha256", secret)
    .update(`${uid}|${next}`)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  try {
    const aa = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const uid = String(body?.uid ?? "");
    const sig = String(body?.sig ?? "");
    const next = String(body?.next ?? "/");
    const flow = String(body?.flow ?? ""); // "signup"일 때만 보상 트리거

    if (!uid || !sig) {
      return NextResponse.json(
        { ok: false, error: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    // ✅ sig 검증
    const expected = signSignup(uid, next);
    if (!safeEqual(sig, expected)) {
      return NextResponse.json(
        { ok: false, error: "BAD_SIGNATURE" },
        { status: 401 }
      );
    }

    const locale = req.cookies.get("NEXT_LOCALE")?.value ?? "ko";

    // ✅ terms_accepted upsert (서비스롤)
    let lastErr: any = null;

    for (let i = 0; i < 5; i++) {
      const { error } = await adminSupabase.from("profiles").upsert(
        {
          id: uid,
          locale,
          terms_accepted: true,
        },
        { onConflict: "id" }
      );

      if (!error) {
        lastErr = null;
        break;
      }

      lastErr = error;

      if (String(error.message || "").includes("profiles_id_fkey")) {
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }

      return NextResponse.json(
        { ok: false, error: "PROFILE_UPSERT_FAILED", detail: error.message },
        { status: 500 }
      );
    }

    if (lastErr) {
      return NextResponse.json(
        {
          ok: false,
          error: "PROFILE_UPSERT_FAILED",
          detail: lastErr?.message ?? "UNKNOWN",
        },
        { status: 500 }
      );
    }
    // ✅ 가입보상: signup 플로우일 때만 (중복은 grantSignupReward가 자체 처리)
    let rewardInfo: any = null;
    const rewardResult = await grantSignupReward({
      userId: uid,
      locale,
      reward: 10,
    });

    console.log('rewardInfo!!!!', rewardResult)

    // 보상 실패여도 "가입완료"는 성공 처리 (로그만)
    if (!rewardResult.ok) {
      console.error(
        "signup reward error:",
        rewardResult.error,
        rewardResult.detail
      );
    } else {
      rewardInfo = rewardResult;
    }

    return NextResponse.json({ ok: true, reward: rewardInfo });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: e?.message ?? "UNKNOWN" },
      { status: 500 }
    );
  }
}
