import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import {
  DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB,
  readUploadedDocument,
} from "@/app/api/document-uploads/shared";

export const runtime = "nodejs";

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export async function POST(req: NextRequest) {
  let cleanup: (() => Promise<void>) | null = null;
  try {
    const input = await readUploadedDocument(req, "docx", {
      fileRequired: "업로드할 Word 파일을 선택해 주세요.",
      unsupportedType:
        "현재는 .docx 파일만 지원합니다. Word에서 .docx로 저장한 뒤 업로드해 주세요.",
      tooLarge: `파일 용량이 너무 큽니다. ${DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB}MB 이하로 업로드해 주세요.`,
      storagePathRequired: "업로드된 문서 경로가 올바르지 않습니다.",
      storageDownloadFailed: "업로드된 문서를 불러오지 못했습니다.",
    });
    if ("response" in input) return input.response;

    cleanup = input.document.cleanup;
    const buffer = input.document.buffer;

    const result = await mammoth.extractRawText({ buffer });
    const extractedText = normalizeExtractedText(result.value ?? "");

    if (!extractedText) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NO_EXTRACTED_TEXT",
          error: "문서에서 텍스트를 추출하지 못했습니다. 다른 .docx 파일로 다시 시도해 주세요.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: input.document.fileName,
      sourceType: "file",
      fileType: "docx",
      extractedText,
      charCount: extractedText.length,
      warnings: [],
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        errorCode: "PROCESSING_FAILED",
        error: "문서 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  } finally {
    if (cleanup) await cleanup();
  }
}
