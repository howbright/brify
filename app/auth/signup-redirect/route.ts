import { completeSignupIntent } from "@/app/lib/auth/completeSignupIntent";
import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["ko", "en", "fr"] as const;

function normalizeLocale(value: string | null | undefined) {
  return SUPPORTED_LOCALES.includes(value as (typeof SUPPORTED_LOCALES)[number])
    ? (value as (typeof SUPPORTED_LOCALES)[number])
    : "ko";
}

function safeDecodeCookie(value: string | undefined) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeNext(raw: string | null, locale: string) {
  const next = (raw ?? "").trim();
  if (!next || next === "/") return `/${locale}`;
  if (!next.startsWith("/") || next.startsWith("//")) return `/${locale}`;
  if (
    SUPPORTED_LOCALES.some(
      (supported) =>
        next === `/${supported}` ||
        next.startsWith(`/${supported}/`) ||
        next.startsWith(`/${supported}?`) ||
        next.startsWith(`/${supported}#`)
    )
  ) {
    return next;
  }
  return `/${locale}${next === "/" ? "" : next}`;
}

function clearSignupIntentCookies(response: NextResponse) {
  for (const name of ["brify_signup_terms", "brify_signup_locale", "brify_signup_next"]) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
  }
}

export async function GET(req: NextRequest) {
  const locale = normalizeLocale(
    req.nextUrl.searchParams.get("locale") ??
      safeDecodeCookie(req.cookies.get("brify_signup_locale")?.value) ??
      req.cookies.get("NEXT_LOCALE")?.value
  );
  const nextPath = normalizeNext(
    safeDecodeCookie(req.cookies.get("brify_signup_next")?.value) ??
      req.nextUrl.searchParams.get("next"),
    locale
  );

  const response = NextResponse.redirect(new URL(nextPath, req.nextUrl), 303);
  clearSignupIntentCookies(response);

  if (req.cookies.get("brify_signup_terms")?.value !== "1") {
    return response;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?next=${encodeURIComponent(nextPath)}`, req.nextUrl),
      303
    );
  }

  await completeSignupIntent({
    userId: user.id,
    email: user.email ?? null,
    locale,
    logPrefix: "[auth/signup-redirect]",
  });

  return response;
}
