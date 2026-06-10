import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function getFileExtension(name: string) {
  const index = name.lastIndexOf(".");
  if (index < 0) return "";
  return name.slice(index + 1).toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const uploaded = formData.get("file");

    if (!(uploaded instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "FILE_REQUIRED",
          error: "업로드할 Word 파일을 선택해 주세요.",
        },
        { status: 400 }
      );
    }

    const extension = getFileExtension(uploaded.name);
    if (extension !== "docx") {
      return NextResponse.json(
        {
          success: false,
          errorCode: "UNSUPPORTED_FILE_TYPE",
          error:
            "현재는 .docx 파일만 지원합니다. Word에서 .docx로 저장한 뒤 업로드해 주세요.",
        },
        { status: 400 }
      );
    }

    if (uploaded.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "FILE_TOO_LARGE",
          maxFileSizeMb: MAX_FILE_SIZE_MB,
          error: `파일 용량이 너무 큽니다. ${MAX_FILE_SIZE_MB}MB 이하로 업로드해 주세요.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await uploaded.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
      fileName: uploaded.name,
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
  }
}
