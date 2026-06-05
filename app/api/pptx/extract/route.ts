import { NextRequest, NextResponse } from "next/server";
import { inflateRawSync } from "node:zlib";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;

type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

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

function decodeXmlEntities(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function findEndOfCentralDirectory(buffer: Buffer) {
  const maxSearch = Math.max(0, buffer.length - 0xffff - 22);
  for (let offset = buffer.length - 22; offset >= maxSearch; offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) return offset;
  }
  return -1;
}

function readZipEntries(buffer: Buffer): ZipEntry[] {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset < 0) {
    throw new Error("INVALID_PPTX");
  }

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries: ZipEntry[] = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error("INVALID_PPTX");
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8");

    entries.push({
      name,
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function readEntryText(buffer: Buffer, entry: ZipEntry) {
  const offset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(offset) !== LOCAL_FILE_SIGNATURE) {
    throw new Error("INVALID_PPTX");
  }

  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressed.toString("utf8");
  }

  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressed).toString("utf8");
  }

  return "";
}

function getSlideNumber(name: string) {
  const match = name.match(/(?:slide|notesSlide)(\d+)\.xml$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function extractTextRuns(xml: string) {
  const matches = Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g));
  return matches
    .map((match) => decodeXmlEntities(match[1] ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

function buildPresentationText(buffer: Buffer) {
  const entries = readZipEntries(buffer);
  const slideEntries = entries
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.name))
    .sort((a, b) => getSlideNumber(a.name) - getSlideNumber(b.name));
  const notesEntries = new Map(
    entries
      .filter((entry) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(entry.name))
      .map((entry) => [getSlideNumber(entry.name), entry])
  );

  const sections = slideEntries
    .map((slideEntry, index) => {
      const slideNumber = getSlideNumber(slideEntry.name);
      const slideText = extractTextRuns(readEntryText(buffer, slideEntry));
      const notesEntry = notesEntries.get(slideNumber);
      const notesText = notesEntry
        ? extractTextRuns(readEntryText(buffer, notesEntry))
        : "";

      const parts = [`[슬라이드 ${index + 1}]`];
      if (slideText) parts.push(slideText);
      if (notesText) parts.push(`[발표자 노트]\n${notesText}`);
      return parts.join("\n");
    })
    .filter((section) => section.replace(/\[슬라이드 \d+\]/, "").trim());

  return normalizeExtractedText(sections.join("\n\n"));
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
          maxFileSizeMb: 50,
          error: "파일 용량이 너무 큽니다. 50MB 이하로 업로드해 주세요.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await uploaded.arrayBuffer());
    const extractedText = buildPresentationText(buffer);

    if (!extractedText) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NO_EXTRACTED_TEXT",
          error: "PPTX에서 텍스트를 추출하지 못했습니다.",
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
