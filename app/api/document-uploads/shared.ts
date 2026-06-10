import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";

export const DOCUMENT_UPLOAD_BUCKET = "document-uploads";
export const DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB = 50;
export const DOCUMENT_UPLOAD_MAX_FILE_SIZE =
  DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024;
export const DOCUMENT_UPLOAD_ALLOWED_EXTENSIONS = ["docx", "pdf", "pptx"] as const;

export type DocumentUploadExtension =
  (typeof DOCUMENT_UPLOAD_ALLOWED_EXTENSIONS)[number];

export type UploadedDocument = {
  fileName: string;
  buffer: Buffer;
  size: number;
  cleanup: (() => Promise<void>) | null;
};

type StoredDocumentPayload = {
  bucket?: unknown;
  path?: unknown;
  fileName?: unknown;
  fileType?: unknown;
};

export function getFileExtension(name: string) {
  const index = name.lastIndexOf(".");
  if (index < 0) return "";
  return name.slice(index + 1).toLowerCase();
}

export function isSupportedDocumentExtension(
  value: string
): value is DocumentUploadExtension {
  return DOCUMENT_UPLOAD_ALLOWED_EXTENSIONS.includes(
    value as DocumentUploadExtension
  );
}

export function contentTypeForDocumentExtension(extension: string) {
  if (extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (extension === "pptx") {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (extension === "pdf") return "application/pdf";
  return "application/octet-stream";
}

export function safeFilePart(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export function jsonDocumentError(
  status: number,
  errorCode: string,
  error: string,
  extras: Record<string, unknown> = {}
) {
  return NextResponse.json(
    {
      success: false,
      errorCode,
      error,
      ...extras,
    },
    { status }
  );
}

export async function cleanupStoredDocument(path: string) {
  const { error } = await adminSupabase.storage
    .from(DOCUMENT_UPLOAD_BUCKET)
    .remove([path]);

  if (error) {
    console.error("[document-uploads] cleanup failed", {
      path,
      message: error.message,
      name: error.name,
    });
  }
}

function isStoragePayload(value: unknown): value is StoredDocumentPayload {
  return Boolean(value && typeof value === "object");
}

function validateStoredPath(path: string) {
  if (!path || path.startsWith("/") || path.includes("..")) return false;
  return /^(anonymous|users)\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9._/-]+$/i.test(path);
}

export async function readUploadedDocument(
  req: NextRequest,
  expectedExtension: DocumentUploadExtension,
  labels: {
    fileRequired: string;
    unsupportedType: string;
    tooLarge: string;
    storagePathRequired: string;
    storageDownloadFailed: string;
  }
): Promise<{ document: UploadedDocument } | { response: NextResponse }> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as unknown;
    if (!isStoragePayload(body)) {
      return {
        response: jsonDocumentError(400, "FILE_REQUIRED", labels.fileRequired),
      };
    }

    const bucket = typeof body.bucket === "string" ? body.bucket : "";
    const path = typeof body.path === "string" ? body.path.trim() : "";
    const fileName =
      typeof body.fileName === "string" ? body.fileName.trim() : "";
    const fileType =
      typeof body.fileType === "string" ? body.fileType.trim().toLowerCase() : "";
    const extension = getFileExtension(fileName || path);

    if (
      bucket !== DOCUMENT_UPLOAD_BUCKET ||
      !validateStoredPath(path) ||
      !fileName
    ) {
      return {
        response: jsonDocumentError(
          400,
          "STORAGE_PATH_REQUIRED",
          labels.storagePathRequired
        ),
      };
    }

    if (extension !== expectedExtension || fileType !== expectedExtension) {
      return {
        response: jsonDocumentError(
          400,
          "UNSUPPORTED_FILE_TYPE",
          labels.unsupportedType
        ),
      };
    }

    const { data, error } = await adminSupabase.storage
      .from(DOCUMENT_UPLOAD_BUCKET)
      .download(path);

    if (error || !data) {
      await cleanupStoredDocument(path);
      return {
        response: jsonDocumentError(
          500,
          "STORAGE_DOWNLOAD_FAILED",
          labels.storageDownloadFailed
        ),
      };
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    if (buffer.length > DOCUMENT_UPLOAD_MAX_FILE_SIZE) {
      await cleanupStoredDocument(path);
      return {
        response: jsonDocumentError(400, "FILE_TOO_LARGE", labels.tooLarge, {
          maxFileSizeMb: DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB,
        }),
      };
    }

    return {
      document: {
        fileName,
        buffer,
        size: buffer.length,
        cleanup: () => cleanupStoredDocument(path),
      },
    };
  }

  const formData = await req.formData();
  const uploaded = formData.get("file");

  if (!(uploaded instanceof File)) {
    return {
      response: jsonDocumentError(400, "FILE_REQUIRED", labels.fileRequired),
    };
  }

  if (getFileExtension(uploaded.name) !== expectedExtension) {
    return {
      response: jsonDocumentError(
        400,
        "UNSUPPORTED_FILE_TYPE",
        labels.unsupportedType
      ),
    };
  }

  if (uploaded.size > DOCUMENT_UPLOAD_MAX_FILE_SIZE) {
    return {
      response: jsonDocumentError(400, "FILE_TOO_LARGE", labels.tooLarge, {
        maxFileSizeMb: DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB,
      }),
    };
  }

  return {
    document: {
      fileName: uploaded.name,
      buffer: Buffer.from(await uploaded.arrayBuffer()),
      size: uploaded.size,
      cleanup: null,
    },
  };
}
