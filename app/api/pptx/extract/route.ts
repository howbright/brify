import { NextRequest, NextResponse } from "next/server";
import { parseOffice, type OfficeContentNode } from "officeparser";
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
  let cleanup: (() => Promise<void>) | null = null;
  try {
    const input = await readUploadedDocument(req, "pptx", {
      fileRequired: "업로드할 PowerPoint 파일을 선택해 주세요.",
      unsupportedType: "현재는 .pptx 파일만 지원합니다.",
      tooLarge: `파일 용량이 너무 큽니다. ${DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB}MB 이하로 업로드해 주세요.`,
      storagePathRequired: "업로드된 문서 경로가 올바르지 않습니다.",
      storageDownloadFailed: "업로드된 문서를 불러오지 못했습니다.",
    });
    if ("response" in input) return input.response;

    cleanup = input.document.cleanup;
    const buffer = input.document.buffer;
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
      fileName: input.document.fileName,
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
  } finally {
    if (cleanup) await cleanup();
  }
}
