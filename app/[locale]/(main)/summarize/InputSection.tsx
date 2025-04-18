"use client";

import { useState } from "react";
import { SourceType } from "./SourceTabs";
import clsx from "clsx";
import { Icon } from "@iconify/react";

interface Props {
  type: SourceType;
  onExtracted: (text: string, succeed: boolean) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  onManualSubmit?: (text: string) => void; // 🔹 요약용 콜백
}

export default function InputSection({
  type,
  onExtracted,
  isLoading,
  setIsLoading,
  onManualSubmit,
}: Props) {
  const [textInput, setTextInput] = useState<string>("");
  const [fileInput, setFileInput] = useState<File | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      if (type === "manual") {
        // ✅ 바로 요약 실행
        onManualSubmit?.(textInput);
        return;
      }

      if (type === "youtube") {
        const res = await fetch("/api/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: textInput }),
        });

        const data = await res.json();

        if (res.ok) {
          const fullText = data.transcript.map((t: any) => t.text).join(" ");
          onExtracted(`🔗 유튜브 영상에서 추출한 스크립트입니다.\n\n${fullText}`, true);
        } else {
          onExtracted("❌ 유튜브 스크립트 추출에 실패했습니다.", false);
        }
      } else if (type === "website") {
        onExtracted("🌐 웹사이트에서 본문을 크롤링했습니다.", true);
      } else if (type === "file") {
        onExtracted("📄 문서에서 텍스트를 추출했습니다.", true);
      }
    } catch (err) {
      console.error(err);
      onExtracted("⚠️ 처리 중 오류가 발생했습니다.", false);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit =
    isLoading ||
    (["youtube", "website", "manual"].includes(type) && !textInput) ||
    (type === "file" && !fileInput);

  const renderInputField = () => {
    if (type === "youtube" || type === "website") {
      return (
        <div className="space-y-2 text-center">
          <input
            type="text"
            placeholder={
              type === "youtube"
                ? "YouTube 영상 주소를 입력하세요"
                : "웹사이트 주소를 입력하세요"
            }
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full border border-gray-300 dark:border-white/20 p-3 rounded-lg focus:outline-hidden focus:ring-primary bg-white dark:bg-black"
          />
          {type === "website" && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              대부분의 웹사이트는 요약이 가능하지만, 일부 로그인 필요하거나
              보안설정된 사이트는 지원되지 않을 수 있어요.
            </p>
          )}
        </div>
      );
    }

    if (type === "file") {
      return (
        <div className="w-full max-w-md mx-auto rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-900 p-5 shadow-xs text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-800 dark:text-white">
            <Icon icon="mdi:file-upload-outline" width={22} />
            파일 업로드
          </div>
          <input
            type="file"
            accept=".pdf,.docx,.txt,.jpg,.png"
            onChange={(e) => setFileInput(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500 file:mx-auto file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary-dark transition cursor-pointer"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            PDF, DOCX, TXT 파일을 지원합니다. <br />
            <span className="text-red-500 font-medium">
              이미지 파일(JPG, PNG)은 Pro 전용 기능
            </span>
            입니다.
          </p>
        </div>
      );
    }

    if (type === "manual") {
      return (
        <textarea
          rows={6}
          placeholder="직접 입력하거나 붙여넣기 해주세요"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="w-full border border-gray-300 dark:border-white/20 p-3 rounded-lg focus:outline-hidden focus:ring-primary bg-white dark:bg-black"
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto text-center">
      {renderInputField()}

      <div className="flex justify-center mt-5">
        <button
          disabled={canSubmit}
          onClick={handleSubmit}
          className={clsx(
            "group flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg text-white bg-primary transition-all duration-200",
            "hover:bg-primary-dark hover:shadow-md",
            (canSubmit || isLoading) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <>
              <Icon icon="lucide:loader" className="animate-spin" width={18} />
              처리 중...
            </>
          ) : (
            <>
              <span>{type === "manual" ? "핵심정리 시작하기" : "원문 추출하기"}</span>
              <Icon
                icon="lucide:arrow-right"
                width={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
