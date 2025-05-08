"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useState } from "react";

interface UploadCardProps {
  onFileSelected: (file: File) => void;
}

export default function UploadCard({ onFileSelected }: UploadCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null); // ✅ 추가

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelected(file);
        setSelectedFileName(file.name); // ✅ 파일명 저장
      }
    } else {
      console.warn('드롭된 파일이 없습니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onFileSelected(file);
      setSelectedFileName(file.name); // ✅ 파일명 저장
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className={clsx(
          "rounded-xl bg-primary/5 dark:bg-[#18181c] p-6 space-y-4 transition-all",
          dragOver && "ring-2 ring-primary"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="text-left">
          <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">
            파일 업로드
          </label>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-border rounded-lg bg-white dark:bg-black">
          <Icon icon="mdi:file-upload-outline" width={36} className="text-primary" />
          
          {/* ✅ 파일명 표시 */}
          {selectedFileName ? (
            <p className="text-sm font-medium text-text dark:text-foreground">{selectedFileName}</p>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              이곳으로 파일을 드래그하거나<br /> 아래 버튼을 클릭해 선택하세요
            </p>
          )}

          <input
            type="file"
            accept=".pdf,.docx,.txt,.jpg,.png"
            onChange={handleFileChange}
            className="hidden"
            id="fileUpload"
          />
          <label
            htmlFor="fileUpload"
            className="mt-2 inline-block px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold cursor-pointer hover:bg-primary-hover transition"
          >
            파일 선택
          </label>
        </div>

        <p className="mt-4 text-xs text-muted-foreground leading-relaxed text-center">
          PDF, DOCX, TXT 파일을 지원합니다. <br />
          <span className="text-primary font-semibold">
            이미지 파일(JPG, PNG)은 Pro 전용 기능입니다.
          </span>
        </p>
      </div>
    </div>
  );
}
