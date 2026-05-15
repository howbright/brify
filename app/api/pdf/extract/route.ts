import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "node:module";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const LOW_TEXT_THRESHOLD = 300;
const LOW_TEXT_MIN_PAGES = 2;

type PdfParseModule = typeof import("pdf-parse");

let pdfParseModulePromise: Promise<PdfParseModule> | null = null;
let pdfWorkerConfigured = false;
let pdfWorkerSrc: string | null = null;

class MinimalDOMMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  constructor(init?: ArrayLike<number> | null) {
    const values = init ? Array.from(init).slice(0, 6) : [];
    this.a = values[0] ?? 1;
    this.b = values[1] ?? 0;
    this.c = values[2] ?? 0;
    this.d = values[3] ?? 1;
    this.e = values[4] ?? 0;
    this.f = values[5] ?? 0;
  }

  multiplySelf() {
    return this;
  }

  preMultiplySelf() {
    return this;
  }

  translate() {
    return this;
  }

  translateSelf() {
    return this;
  }

  scale() {
    return this;
  }

  scaleSelf() {
    return this;
  }

  rotateSelf() {
    return this;
  }

  invertSelf() {
    return this;
  }

  transformPoint<T>(point: T) {
    return point;
  }
}

class MinimalImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(
    dataOrWidth: Uint8ClampedArray | number,
    width?: number,
    height?: number
  ) {
    if (typeof dataOrWidth === "number") {
      this.width = dataOrWidth;
      this.height = width ?? 0;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
      return;
    }

    this.data = dataOrWidth;
    this.width = width ?? 0;
    this.height = height ?? 0;
  }
}

class MinimalPath2D {
  addPath() {}
}

function ensurePdfRuntimePolyfills() {
  if (typeof globalThis.DOMMatrix === "undefined") {
    Object.assign(globalThis, { DOMMatrix: MinimalDOMMatrix });
  }
  if (typeof globalThis.ImageData === "undefined") {
    Object.assign(globalThis, { ImageData: MinimalImageData });
  }
  if (typeof globalThis.Path2D === "undefined") {
    Object.assign(globalThis, { Path2D: MinimalPath2D });
  }
}

async function loadPdfParseModule() {
  ensurePdfRuntimePolyfills();
  if (!pdfParseModulePromise) {
    pdfParseModulePromise = import("pdf-parse");
  }
  const pdfModule = await pdfParseModulePromise;
  if (!pdfWorkerConfigured) {
    const require = createRequire(import.meta.url);
    if (!pdfWorkerSrc) {
      const workerModule = require("pdf-parse/worker") as {
        getData?: () => string;
        getPath?: () => string;
      };
      pdfWorkerSrc = workerModule.getData?.() || workerModule.getPath?.() || "";
    }
    if (pdfWorkerSrc) {
      pdfModule.PDFParse.setWorker(pdfWorkerSrc);
    }
    pdfWorkerConfigured = true;
  }
  return pdfModule;
}

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

function getPdfErrorName(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const raw = "name" in error ? error.name : "";
  return typeof raw === "string" ? raw : "";
}

function isEncryptedPdfError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const name = getPdfErrorName(error);

  return (
    name === "PasswordException" ||
    message.includes("PasswordException") ||
    message.toLowerCase().includes("password") ||
    message.toLowerCase().includes("encrypted")
  );
}

function isInvalidPdfError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const name = getPdfErrorName(error);
  const knownInvalidName =
    name === "InvalidPDFException" ||
    name === "FormatError" ||
    name === "ResponseException" ||
    name === "AbortException" ||
    name === "UnknownErrorException";

  return (
    knownInvalidName ||
    /xref|trailer|catalog|invalid pdf|bad xref|format/i.test(message)
  );
}

async function tryExtractPdfText(buffer: Buffer) {
  const { PDFParse, VerbosityLevel } = await loadPdfParseModule();
  const attempts: Array<() => Promise<{ text?: string; total?: number; pages?: Array<{ text?: string }> }>> = [
    async () => {
      const parser = new PDFParse({
        data: buffer,
        verbosity: VerbosityLevel.ERRORS,
      });
      try {
        return await parser.getText({ pageJoiner: "" });
      } finally {
        await parser.destroy?.();
      }
    },
    async () => {
      const parser = new PDFParse({
        data: buffer,
        verbosity: VerbosityLevel.ERRORS,
      });
      try {
        return await parser.getText({
          pageJoiner: "",
          disableNormalization: true,
        });
      } finally {
        await parser.destroy?.();
      }
    },
  ];

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (isEncryptedPdfError(error) || isInvalidPdfError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
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
          error: "업로드할 PDF 파일을 선택해 주세요.",
        },
        { status: 400 }
      );
    }

    const extension = getFileExtension(uploaded.name);
    if (extension !== "pdf") {
      return NextResponse.json(
        {
          success: false,
          errorCode: "UNSUPPORTED_FILE_TYPE",
          error: "현재는 .pdf 파일만 지원합니다.",
        },
        { status: 400 }
      );
    }

    if (uploaded.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "FILE_TOO_LARGE",
          maxFileSizeMb: 50,
          error: "파일 용량이 너무 큽니다. 50MB 이하로 업로드해 주세요.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await uploaded.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await tryExtractPdfText(buffer);

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
          errorCode: "NO_EXTRACTED_TEXT",
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
    if (isEncryptedPdfError(error)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "ENCRYPTED_PDF",
          error: "암호화된 PDF는 현재 지원하지 않습니다. 암호를 제거한 PDF로 다시 시도해 주세요.",
          detail: process.env.NODE_ENV !== "production" ? message : undefined,
        },
        { status: 422 }
      );
    }
    if (isInvalidPdfError(error)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "INVALID_PDF",
          error:
            "이 PDF는 손상되었거나 현재 추출기에서 읽기 어려운 형식일 수 있습니다. 다른 PDF로 다시 저장하거나 원본 파일로 다시 시도해 주세요.",
          detail: process.env.NODE_ENV !== "production" ? message : undefined,
        },
        { status: 422 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        errorCode: "PROCESSING_FAILED",
        error: "PDF 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
        detail: process.env.NODE_ENV !== "production" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
