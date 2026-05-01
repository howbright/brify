// app/api/signup/complete/route.ts
import { grantSignupReward } from "@/app/lib/rewards/grantSignupReward";
import { adminSupabase } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
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

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const uidFromBody = String(body?.uid ?? "");
    const sig = String(body?.sig ?? "");
    const next = String(body?.next ?? "/");

    const locale = req.cookies.get("NEXT_LOCALE")?.value ?? "ko";

    // ✅ 0) 세션 유저 확인 (세션 모드/보안 강화에 사용)
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userEmail = user.email ?? null;

    // ✅ 1) uid 결정
    // - signed flow(uid+sig 있으면): uidFromBody 사용 (단, 세션 유저와 일치 체크)
    // - session flow(없으면): 세션 유저 id 사용
    let uid = user.id;
    const hasSignedFlow = Boolean(uidFromBody && sig);

    if (hasSignedFlow) {
      // ✅ 보안 강화: 세션 유저와 uid가 다르면 거절
      if (uidFromBody !== user.id) {
        return NextResponse.json(
          { ok: false, error: "UID_MISMATCH" },
          { status: 403 }
        );
      }

      // ✅ sig 검증
      const expected = signSignup(uidFromBody, next);
      if (!safeEqual(sig, expected)) {
        return NextResponse.json(
          { ok: false, error: "BAD_SIGNATURE" },
          { status: 401 }
        );
      }

      uid = uidFromBody;
    }

    // ✅ 2) profiles 접근 가능 여부 확인
    const { error: beforeErr } = await adminSupabase
      .from("profiles")
      .select("terms_accepted, email")
      .eq("id", uid)
      .maybeSingle();

    if (beforeErr) {
      return NextResponse.json(
        { ok: false, error: "PROFILE_READ_FAILED", detail: beforeErr.message },
        { status: 500 }
      );
    }

    // ✅ 3) terms_accepted upsert (서비스롤)
    let lastErr: any = null;

    for (let i = 0; i < 5; i++) {
      const { error } = await adminSupabase.from("profiles").upsert(
        {
          id: uid,
          email: userEmail,
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

      // FK 지연(유저 row 생성 타이밍) 대응
      if (String(error.message || "").includes("profiles_id_fkey")) {
        await sleep(200);
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

    // ✅ 4) 보상 지급 시도 (항상 호출)
    // - grantSignupReward 내부가 credit_transactions(reason='signup_reward')로 중복 방지
    // - terms 상태가 예상과 다르게 이미 true여도, 보상 tx가 없다면 여기서 복구 가능
    let rewardInfo: any = null;
    const rewardResult = await grantSignupReward({
      userId: uid,
      locale,
      reward: 15,
    });

    // 보상 실패여도 "동의 완료"는 성공 처리
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
