"use client";

import EditableTitle from "@/components/EditableTitle";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import React from "react";

interface SummaryHeaderProps {
  id: string;
  title: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  lang: string | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
  sourceType: string;
  onTitleSaved: (newTitle: string, updatedAt: string | null) => void;
}

export default function SummaryHeader({
  id,
  title,
  status,
  createdAt,
  updatedAt,
  lang,
  sourceTitle,
  sourceUrl,
  sourceType,
  onTitleSaved,
}: SummaryHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex flex-col gap-4 border-b pb-4">
      {/* 상단 라인: 뒤로가기 + 이전/다음 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/my-summaries")}
            className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-gray-100 transition"
          >
            <Icon icon="mdi:arrow-left" className="w-5 h-5" />
            <span>목록으로</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="flex items-center gap-1 px-2 py-1.5 rounded text-gray-400 cursor-not-allowed"
          >
            <Icon icon="mdi:chevron-left" className="w-5 h-5" />
            이전 글
          </button>
          <button
            disabled
            className="flex items-center gap-1 px-2 py-1.5 rounded text-gray-400 cursor-not-allowed"
          >
            다음 글
            <Icon icon="mdi:chevron-right" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 제목 */}
      <div className="flex items-start gap-3 w-full">
        <EditableTitle
          id={id}
          initialTitle={title || "제목 없는 요약"}
          onTitleSaved={onTitleSaved}
        />
      </div>

      {/* 메타 정보 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
        {status && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
              ${
                status === "completed"
                  ? "bg-green-100 text-green-800"
                  : status === "processing"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
          >
            {status.toUpperCase()}
          </span>
        )}
        <span>
          생성일:{" "}
          {createdAt
            ? new Date(createdAt).toLocaleString(undefined, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </span>
        {updatedAt && (
          <span>
            수정일:{" "}
            {new Date(updatedAt).toLocaleString(undefined, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        <span>언어: {lang || "알 수 없음"}</span>
        <span>
          출처:{" "}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {sourceTitle || sourceUrl}
            </a>
          ) : (
            sourceTitle || sourceType
          )}
        </span>
      </div>
    </header>
  );
}
