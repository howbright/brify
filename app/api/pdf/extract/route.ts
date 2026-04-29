import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const LOW_TEXT_THRESHOLD = 300;
const LOW_TEXT_MIN_PAGES = 2;

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gim, "")
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
        { success: false, error: "업로드할 PDF 파일을 선택해 주세요." },
        { status: 400 }
      );
    }

    const extension = getFileExtension(uploaded.name);
    if (extension !== "pdf") {
      return NextResponse.json(
        { success: false, error: "현재는 .pdf 파일만 지원합니다." },
        { status: 400 }
      );
    }

    if (uploaded.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "파일 용량이 너무 큽니다. 20MB 이하로 업로드해 주세요." },
        { status: 400 }
      );
    }

    const arrayBuffer = await uploaded.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const requireFn = eval("require") as NodeRequire;
    const pdfParseModule = requireFn("pdf-parse") as {
      PDFParse?: new (options: { data: Buffer }) => {
        getText: () => Promise<{ text?: string; total?: number }>;
        destroy?: () => Promise<void> | void;
      };
    };

    const PDFParse = pdfParseModule.PDFParse;
    if (!PDFParse) {
      throw new Error("pdf-parse module does not export PDFParse");
    }

    let result: { text?: string; total?: number; pages?: Array<{ text?: string }> };
    let parser:
      | {
          getText: () => Promise<{ text?: string; total?: number }>;
          destroy?: () => Promise<void> | void;
        }
      | null = null;
    try {
      parser = new PDFParse({ data: buffer });
      result = await parser.getText({
        pageJoiner: "",
      });
    } finally {
      try {
        await parser?.destroy?.();
      } catch {
        // ignore cleanup errors
      }
    }

    const fallbackText =
      Array.isArray(result.pages) && result.pages.length > 0
        ? result.pages
            .map((page) => (typeof page?.text === "string" ? page.text : ""))
            .join("\n\n")
        : "";

    const extractedText = normalizeExtractedText(
      (result.text && result.text.length > 0 ? result.text : fallbackText) ?? ""
    );
    const pageCount = typeof result.total === "number" ? result.total : 1;
    const isLowTextLikelyScanned =
      extractedText.length < LOW_TEXT_THRESHOLD && pageCount >= LOW_TEXT_MIN_PAGES;

    if (!extractedText) {
      return NextResponse.json(
        {
          success: false,
          error:
            "PDF에서 텍스트를 추출하지 못했습니다. 이미지 기반 PDF(스캔본)일 수 있으며, 프린트 기능으로 만든 PDF는 일부 텍스트 추출이 어려울 수 있습니다.",
          likelyScanned: true,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: uploaded.name,
      sourceType: "file",
      fileType: "pdf",
      extractedText,
      charCount: extractedText.length,
      pageCount,
      likelyScanned: isLowTextLikelyScanned,
      warning: isLowTextLikelyScanned
        ? "이 PDF는 이미지 기반(스캔본)일 가능성이 높습니다. 또한 프린트 기능으로 만든 PDF는 일부 텍스트 추출이 어려울 수 있습니다."
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("[pdf/extract] failed:", error);
    if (
      message.includes("PasswordException") ||
      message.toLowerCase().includes("password") ||
      message.includes("encrypted")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "암호화된 PDF는 현재 지원하지 않습니다. 암호를 제거한 PDF로 다시 시도해 주세요.",
          detail: process.env.NODE_ENV !== "production" ? message : undefined,
        },
        { status: 422 }
      );
    }
    if (message.includes("Cannot find module 'pdf-parse'")) {
      return NextResponse.json(
        {
          success: false,
          error: "pdf 추출 모듈(pdf-parse)이 설치되지 않았습니다. 관리자에게 문의해 주세요.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "PDF 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
        detail: process.env.NODE_ENV !== "production" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
