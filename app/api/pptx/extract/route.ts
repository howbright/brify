import { NextRequest, NextResponse } from "next/server";
import { parseOffice, type OfficeContentNode } from "officeparser";

export const runtime = "nodejs";

const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

function getFileExtension(name: string) {
  const index = name.lastIndexOf(".");
  if (index < 0) return "";
  return name.slice(index + 1).toLowerCase();
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function collectNodeText(node: OfficeContentNode): string {
  if (node.children?.length) {
    const childText = node.children
      .map(collectNodeText)
      .filter(Boolean)
      .join(node.children.some((child) => child.children?.length) ? "\n" : "");
    return normalizeExtractedText(childText);
  }

  return normalizeExtractedText(node.text ?? "");
}

function formatSlide(slide: OfficeContentNode, index: number) {
  const parts = [`[슬라이드 ${index + 1}]`];
  const slideText = collectNodeText(slide);

  if (slideText) {
    parts.push(slideText);
  }

  const notesText = slide.notes
    ?.map(collectNodeText)
    .filter(Boolean)
    .join("\n\n");

  if (notesText) {
    parts.push(`[발표자 노트]\n${notesText}`);
  }

  return parts.join("\n");
}

function buildPresentationText(content: OfficeContentNode[]) {
  const slides = content.filter((node) => node.type === "slide");

  if (slides.length === 0) {
    return normalizeExtractedText(content.map(collectNodeText).join("\n\n"));
  }

  return normalizeExtractedText(
    slides
      .map(formatSlide)
      .filter((section) => section.replace(/\[슬라이드 \d+\]/, "").trim())
      .join("\n\n")
  );
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
          error: "업로드할 PowerPoint 파일을 선택해 주세요.",
        },
        { status: 400 }
      );
    }

    if (getFileExtension(uploaded.name) !== "pptx") {
      return NextResponse.json(
        {
          success: false,
          errorCode: "UNSUPPORTED_FILE_TYPE",
          error: "현재는 .pptx 파일만 지원합니다.",
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

    const buffer = Buffer.from(await uploaded.arrayBuffer());
    const ast = await parseOffice(buffer, {
      fileType: "pptx",
      ignoreSlideMasters: true,
      extractAttachments: false,
      ocr: false,
    });
    const extractedText = buildPresentationText(ast.content);

    if (!extractedText) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NO_EXTRACTED_TEXT",
          error: "PPTX에서 텍스트를 추출하지 못했습니다.",
          warnings: [],
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: uploaded.name,
      sourceType: "file",
      fileType: "pptx",
      extractedText,
      charCount: extractedText.length,
      warnings: [],
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        errorCode: "PROCESSING_FAILED",
        error: "PPTX 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}
