import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { adminSupabase } from "@/utils/supabase/admin";
import {
  contentTypeForDocumentExtension,
  DOCUMENT_UPLOAD_BUCKET,
  DOCUMENT_UPLOAD_MAX_FILE_SIZE,
  DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB,
  getFileExtension,
  isSupportedDocumentExtension,
  safeFilePart,
} from "../shared";

export const runtime = "nodejs";

type CreateUploadBody = {
  fileName?: unknown;
  fileType?: unknown;
  contentType?: unknown;
  size?: unknown;
};

function jsonError(status: number, errorCode: string, error: string) {
  return NextResponse.json(
    { success: false, errorCode, error },
    { status }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as CreateUploadBody | null;
    const fileName = typeof body?.fileName === "string" ? body.fileName.trim() : "";
    const requestedFileType =
      typeof body?.fileType === "string" ? body.fileType.trim().toLowerCase() : "";
    const contentType =
      typeof body?.contentType === "string" ? body.contentType.trim() : "";
    const size = typeof body?.size === "number" ? body.size : Number(body?.size);

    if (!fileName || !Number.isFinite(size) || size <= 0) {
      return jsonError(
        400,
        "INVALID_UPLOAD_REQUEST",
        "업로드할 문서 정보가 올바르지 않습니다."
      );
    }

    const extension = getFileExtension(fileName);
    if (
      !isSupportedDocumentExtension(extension) ||
      requestedFileType !== extension
    ) {
      return jsonError(
        400,
        "UNSUPPORTED_FILE_TYPE",
        "현재는 DOCX, PDF, PPTX 파일만 지원합니다."
      );
    }

    if (size > DOCUMENT_UPLOAD_MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "FILE_TOO_LARGE",
          maxFileSizeMb: DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB,
          error: `파일 용량이 너무 큽니다. ${DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB}MB 이하로 업로드해 주세요.`,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const scope = user?.id ? `users/${user.id}` : "anonymous";
    const safeBase =
      safeFilePart(fileName.replace(/\.[^.]+$/, "")) || "document";
    const path = `${scope}/${year}/${month}/${day}/${crypto.randomUUID()}-${safeBase}.${extension}`;

    const { data, error } = await adminSupabase.storage
      .from(DOCUMENT_UPLOAD_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data?.token) {
      console.error("[document-uploads/create] signed upload failed", {
        message: error?.message,
        name: error?.name,
        path,
      });
      return jsonError(
        500,
        "SIGNED_UPLOAD_FAILED",
        "문서 업로드 준비 중 오류가 발생했습니다."
      );
    }

    return NextResponse.json({
      success: true,
      bucket: DOCUMENT_UPLOAD_BUCKET,
      path,
      token: data.token,
      fileName,
      fileType: extension,
      contentType: contentType || contentTypeForDocumentExtension(extension),
      maxFileSizeMb: DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB,
    });
  } catch (error) {
    console.error("[document-uploads/create] failed", error);
    return jsonError(
      500,
      "UPLOAD_PREPARE_FAILED",
      "문서 업로드 준비 중 오류가 발생했습니다."
    );
  }
}
