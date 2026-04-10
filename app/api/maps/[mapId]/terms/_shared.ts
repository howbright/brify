import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function getTermsProxyContext() {
  const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!backendBase) {
    return {
      ok: false as const,
      response: jsonError(500, "NEXT_PUBLIC_API_BASE_URL is not set"),
    };
  }

  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return {
      ok: false as const,
      response: jsonError(401, "UNAUTHORIZED"),
    };
  }

  return {
    ok: true as const,
    backendBase: backendBase.replace(/\/+$/, ""),
    accessToken: session.access_token,
  };
}

type ProxyRequestInit = {
  method?: string;
  body?: BodyInit | null;
  contentType?: string | null;
};

export async function proxyTermsRequest(
  path: string,
  init: ProxyRequestInit = {}
) {
  const context = await getTermsProxyContext();
  if (!context.ok) {
    return context.response;
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${context.accessToken}`,
    };

    if (init.contentType) {
      headers["Content-Type"] = init.contentType;
    }

    const res = await fetch(`${context.backendBase}${path}`, {
      method: init.method,
      headers,
      body: init.body,
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return jsonError(500, e?.message ?? "INTERNAL_ERROR");
  }
}
