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

const ALLOWED_IMAGE_EXTENSIONS = new Set(["gif", "jpg", "jpeg", "png", "webp"]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function contentTypeFromExtension(extension: string) {
  if (extension === "gif") return "image/gif";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "application/octet-stream";
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

    const extension = safeFilePart(file.name.split(".").pop() ?? "png") || "png";
    const isAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.has(extension);
    const isAllowedMime = file.type.startsWith("image/");
    if (!isAllowedMime && !isAllowedExtension) {
      return NextResponse.json({ error: "IMAGE_ONLY" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          error: "TOO_LARGE",
          maxMb: Math.floor(MAX_IMAGE_BYTES / 1024 / 1024),
        },
        { status: 400 }
      );
    }

    const base = safeFilePart(file.name.replace(/\.[^.]+$/, "")) || "image";
    const path = `${locale}/${Date.now()}-${crypto.randomUUID()}-${base}.${extension}`;
    const contentType = isAllowedMime
      ? file.type
      : contentTypeFromExtension(extension);

    const { error } = await adminSupabase.storage
      .from("blog-images")
      .upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType,
      });

    if (error) {
      console.error("[admin/blog/images] storage upload failed", {
        message: error.message,
        name: error.name,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        contentType,
        path,
      });
      return NextResponse.json(
        { error: "STORAGE_UPLOAD_FAILED", message: error.message },
        { status: 500 }
      );
    }

    const { data } = adminSupabase.storage.from("blog-images").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  } catch (error) {
    console.error("[admin/blog/images] upload failed", error);
    return NextResponse.json(
      {
        error: "UPLOAD_FAILED",
        message: error instanceof Error ? error.message : "Unknown upload error",
      },
      { status: 500 }
    );
  }
}
