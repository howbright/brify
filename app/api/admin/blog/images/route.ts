import { NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";
import { requireBlogAdmin } from "../_auth";

function safeFilePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  const auth = await requireBlogAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const locale = safeFilePart(String(form.get("locale") ?? "blog")) || "blog";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "IMAGE_ONLY" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "TOO_LARGE" }, { status: 400 });
    }

    const extension = safeFilePart(file.name.split(".").pop() ?? "png") || "png";
    const base = safeFilePart(file.name.replace(/\.[^.]+$/, "")) || "image";
    const path = `${locale}/${Date.now()}-${crypto.randomUUID()}-${base}.${extension}`;

    const { error } = await adminSupabase.storage
      .from("blog-images")
      .upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });

    if (error) throw error;

    const { data } = adminSupabase.storage.from("blog-images").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  } catch (error) {
    console.error("[admin/blog/images] upload failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
