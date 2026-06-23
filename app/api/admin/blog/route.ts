import { NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";
import { requireBlogAdmin } from "./_auth";

const VALID_LOCALES = new Set(["ko", "en", "fr"]);
const VALID_STATUSES = new Set(["draft", "published"]);
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type SupabaseMutationError = {
  code?: string;
  message?: string;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSeoKeywords(value: unknown) {
  const rawKeywords = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,，\n]/)
      : [];

  return Array.from(
    new Set(
      rawKeywords
        .map((keyword) => cleanString(keyword))
        .filter(Boolean)
        .slice(0, 20)
    )
  );
}

function normalizePublishedAt(value: unknown, status: string) {
  const raw = cleanString(value);
  if (status !== "published") return null;
  if (!raw) return new Date().toISOString();
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function parsePostPayload(body: any) {
  const locale = cleanString(body?.locale);
  const status = cleanString(body?.status) || "draft";
  const slug = cleanString(body?.slug).toLowerCase();
  const title = cleanString(body?.title);
  const excerpt = cleanString(body?.excerpt);
  const seoKeywords = normalizeSeoKeywords(body?.seoKeywords ?? body?.seo_keywords);
  const imageUrl = cleanString(body?.imageUrl);
  const markdown = typeof body?.markdown === "string" ? body.markdown : "";

  if (!VALID_LOCALES.has(locale)) throw new Error("INVALID_LOCALE");
  if (!VALID_STATUSES.has(status)) throw new Error("INVALID_STATUS");
  if (!SLUG_RE.test(slug)) throw new Error("INVALID_SLUG");
  if (!title) throw new Error("TITLE_REQUIRED");

  return {
    locale,
    status,
    slug,
    title,
    excerpt,
    seo_keywords: seoKeywords,
    image_url: imageUrl,
    markdown,
    published_at: normalizePublishedAt(body?.publishedAt, status),
  };
}

function getMutationErrorResponse(error: unknown, fallbackStatus = 500) {
  const message = error instanceof Error ? error.message : "failed";
  const dbError = error as SupabaseMutationError;
  if (dbError?.code === "23505") {
    return {
      message: "DUPLICATE_SLUG",
      status: 409,
    };
  }
  return {
    message,
    status:
      message === "INVALID_SLUG" ||
      message === "INVALID_LOCALE" ||
      message === "INVALID_STATUS" ||
      message.endsWith("_REQUIRED")
        ? 400
        : fallbackStatus,
  };
}

export async function GET() {
  const auth = await requireBlogAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const { data, error } = await adminSupabase
    .from("blog_posts")
    .select("id,locale,slug,title,excerpt,seo_keywords,image_url,markdown,status,published_at,translation_group_id,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[admin/blog] list failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireBlogAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const payload = parsePostPayload(body);
    const { data, error } = await adminSupabase
      .from("blog_posts")
      .insert({
        ...payload,
        author_id: auth.user.id,
      })
      .select("id,locale,slug,title,excerpt,seo_keywords,image_url,markdown,status,published_at,translation_group_id,created_at,updated_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ post: data });
  } catch (error) {
    const { message, status } = getMutationErrorResponse(error);
    console.error("[admin/blog] create failed", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireBlogAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const id = cleanString(body?.id);
    if (!id) {
      return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
    }

    const payload = parsePostPayload(body);
    const { data, error } = await adminSupabase
      .from("blog_posts")
      .update(payload)
      .eq("id", id)
      .select("id,locale,slug,title,excerpt,seo_keywords,image_url,markdown,status,published_at,translation_group_id,created_at,updated_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ post: data });
  } catch (error) {
    const { message, status } = getMutationErrorResponse(error);
    console.error("[admin/blog] update failed", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireBlogAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const id = cleanString(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
  }

  const { error } = await adminSupabase
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[admin/blog] delete failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
