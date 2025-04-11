"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { SourceType } from "./SourceTabs";

interface Props {
  type: SourceType;
  onExtracted: (text: string) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export default function InputSection({
  type,
  onExtracted,
  isLoading,
  setIsLoading,
}: Props) {
  const [textInput, setTextInput] = useState<string>("");
  const [fileInput, setFileInput] = useState<File | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);

    setTimeout(() => {
      if (type === "youtube") {
        onExtracted("🔗 유튜브 영상에서 추출한 스크립트입니다.");
      } else if (type === "website") {
        onExtracted("🌐 웹사이트에서 본문을 크롤링했습니다.");
      } else if (type === "file") {
        onExtracted("📄 문서에서 텍스트를 추출했습니다.");
      } else if (type === "audio") {
        onExtracted("🎧 오디오에서 텍스트를 추출했습니다.");
      } else if (type === "manual") {
        onExtracted(textInput);
      }
      setIsLoading(false);
    }, 1000);
  };

  const isTextMode = type === "youtube" || type === "website";
  const isFileMode = type === "file" || type === "audio";
  const canSubmit =
    isLoading ||
    (isTextMode && !textInput) ||
    (type === "manual" && !textInput) ||
    (isFileMode && !fileInput);

  return (
    <div className="space-y-4">
      {/* 입력 필드 */}
      {isTextMode && (
        <input
          type="text"
          placeholder={
            type === "youtube"
              ? "YouTube 영상 주소를 입력하세요"
              : "웹사이트 주소를 입력하세요"
          }
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="w-full border border-gray-300 dark:border-white/20 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-black"
        />
      )}

      {isFileMode && (
        <input
          type="file"
          accept={type === "file" ? ".pdf,.docx,.hwp,.jpg,.png" : "audio/*"}
          onChange={(e) => setFileInput(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary-dark"
        />
      )}

      {type === "manual" && (
        <textarea
          rows={6}
          placeholder="직접 입력하거나 붙여넣기 해주세요"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="w-full border border-gray-300 dark:border-white/20 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-black"
        />
      )}

      {/* 제출 버튼 */}
      <button
        disabled={canSubmit}
        onClick={handleSubmit}
        className={clsx(
          "px-6 py-3 font-semibold rounded-lg text-white bg-primary hover:bg-primary-dark transition",
          (canSubmit || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? "추출 중..." : "✅ 원문 추출하기"}
      </button>
    </div>
  );
}
