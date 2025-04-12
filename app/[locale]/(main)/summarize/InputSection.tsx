import { useState } from "react";
import { SourceType } from "./SourceTabs";
import clsx from "clsx";
import { Icon } from "@iconify/react";

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
    <div className="space-y-6 w-full max-w-3xl mx-auto text-center">
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
          className="w-full border border-gray-300 dark:border-white/20 p-3 rounded-lg focus:outline-none focus:ring-primary bg-white dark:bg-black"
        />
      )}

      {isFileMode && (
        <div className="flex justify-center">
          <input
            type="file"
            accept={type === "file" ? ".pdf,.docx,.hwp,.jpg,.png" : "audio/*"}
            onChange={(e) => setFileInput(e.target.files?.[0] ?? null)}
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary-dark transition"
          />
        </div>
      )}

      {type === "manual" && (
        <textarea
          rows={6}
          placeholder="직접 입력하거나 붙여넣기 해주세요"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="w-full border border-gray-300 dark:border-white/20 p-3 rounded-lg focus:outline-none focus:ring-primary bg-white dark:bg-black"
        />
      )}

      {/* 제출 버튼 - 중앙 정렬 */}
      <div className="flex justify-center">
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
              추출 중...
            </>
          ) : (
            <>
              <span>원문 추출하기</span>
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
