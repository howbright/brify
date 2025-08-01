"use client";

import EditableTitle from "@/components/EditableTitle";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { Category, categoryColors } from "@/lib/enums/categories.enum";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import React from "react";
import { Keyword } from "@/app/[locale]/(detail)/my-summaries/[id]/page";
import PrevNextButtons from "./PreNextButtons";
import useSWR from "swr";

interface SummaryHeaderProps {
  id: string;
  title: string;
  createdAt: string | null;
  updatedAt: string | null;
  lang: string | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
  sourceType: string;
  category?: Category | null;
  tags?: Keyword[];
  onTitleSaved: (newTitle: string, updatedAt: string | null) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SummaryHeader({
  id,
  title,
  createdAt,
  updatedAt,
  lang,
  sourceTitle,
  sourceUrl,
  sourceType,
  category,
  tags,
  onTitleSaved,
}: SummaryHeaderProps) {
  const { data, isLoading } = useSWR(
    `/api/summaries/prevnext?id=${id}`,
    fetcher
  );
  const router = useRouter();
  const categoryValue = category || Category.OTHER;

  const createdLabel = createdAt
    ? format(new Date(createdAt), "yyyy.MM.dd HH:mm")
    : null;
  const updatedLabel =
    updatedAt &&
    formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: ko });

  return (
    <header className="border-b pb-3">
      {/* 상단: 뒤로가기 + 이전/다음 */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => router.push("/my-summaries")}
          className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-gray-100 transition"
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5" />
          <span>목록으로</span>
        </button>
        {!isLoading && (
          <PrevNextButtons prevId={data?.prevId} nextId={data?.nextId} />
        )}
      </div>

      {/* 카테고리 + 제목 */}
      <div className="w-full flex items-center gap-3 mb-2">
        <span
          className={`px-3 py-0.5 text-xs font-bold text-white rounded-md ${categoryColors[categoryValue]}`}
        >
          {categoryValue.replace("_", " ")}
        </span>
        <EditableTitle
          id={id}
          initialTitle={title || "제목 없는 요약"}
          onTitleSaved={onTitleSaved}
        />
      </div>

      {/* 태그 */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-700 rounded-full px-3 py-0.5 font-medium"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* 메타 정보 한 줄 */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        {createdLabel && (
          <span className="flex items-center gap-1">
            <Icon icon="mdi:calendar" className="w-4 h-4" />
            {createdLabel}
          </span>
        )}
        {updatedLabel && (
          <span className="flex items-center gap-1">
            <Icon icon="mdi:update" className="w-4 h-4" />
            수정 {updatedLabel}
          </span>
        )}
        {lang && (
          <span className="flex items-center gap-1">
            <Icon icon="mdi:translate" className="w-4 h-4" />
            {lang}
          </span>
        )}
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <Icon icon="mdi:link-variant" className="w-4 h-4" />
            {sourceTitle || sourceUrl}
          </a>
        ) : (
          <span className="flex items-center gap-1">
            <Icon icon="mdi:file-document" className="w-4 h-4" />
            {sourceTitle || sourceType}
          </span>
        )}
      </div>
    </header>
  );
}


