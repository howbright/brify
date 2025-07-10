// app/(main)/my-summaries/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SummaryResult from "@/components/SummaryResult";
import { convertToTree } from "@/app/lib/gtp/convertToTree";
import { toast } from "sonner";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import EditableTitle from "@/components/EditableTitle";

// 타입 정의
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface Summary {
  id: string;
  user_id: string | null;
  created_at: string | null;
  source_type: string;
  source_title: string | null;
  source_url: string | null;
  // original_text: string | null;
  summary_text: string | null;
  detailed_summary_text: string | null;
  diagram_json: Json | null;
  status: string;
  lang: string | null;
  is_public: boolean | null;
  updated_at: string | null;
}

export default function SummaryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ fetch 함수 분리
  const fetchSummary = async (id: string) => {
    try {
      const res = await fetch(`/api/summary?id=${id}`);
      if (res.status === 401) {
        toast.error("로그인이 필요합니다.");
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        toast.error("이 요약에 접근할 수 없습니다.");
        router.push("/my-summaries");
        return;
      }
      if (res.status === 404) {
        toast.error("요약을 찾을 수 없습니다.");
        router.push("/my-summaries");
        return;
      }
      if (!res.ok) {
        toast.error("요약을 불러오는 중 오류가 발생했습니다.");
        return;
      }
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("요약 가져오기 실패:", err);
      toast.error("요약을 불러오는 중 오류가 발생했습니다.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("useEffect 진입:", id);
    if (id && typeof id === "string") {
      fetchSummary(id);
    }
  }, [id, router]);


  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6 flex flex-col gap-y-6">
        <Skeleton height={30} width={200} />
        <Skeleton count={4} />
      </main>
    );
  }

  if (!summary) return null;

  return (
    <main className="max-w-4xl mx-auto p-6 flex flex-col gap-y-8">
      {/* 요약 제목 */}
      <header className="flex flex-col gap-y-2">
        <EditableTitle
          id={summary.id}
          initialTitle={summary.summary_text || "제목 없는 요약"}
          onTitleSaved={(newTitle, updatedAt) =>
            setSummary(
              (prev) =>
                prev && {
                  ...prev,
                  summary_text: newTitle,
                  updated_at: updatedAt,
                }
            )
          }
        />
        <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500">
          {summary.status && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
            ${
              summary.status === "completed"
                ? "bg-green-100 text-green-800"
                : summary.status === "processing"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
            >
              {summary.status.toUpperCase()}
            </span>
          )}
          <span>
            생성일:{" "}
            {summary.created_at
              ? new Date(summary.created_at).toLocaleString()
              : "-"}
          </span>
          {summary.updated_at && (
            <span>수정일: {new Date(summary.updated_at).toLocaleString()}</span>
          )}
          <span>언어: {summary.lang || "알 수 없음"}</span>
        </div>
      </header>

      {/* 메타 정보 */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
            출처 정보
          </h2>
          <ul className="text-sm text-gray-800 dark:text-gray-200 flex flex-col gap-y-1">
            <li>
              <span className="font-medium">출처 타입:</span>{" "}
              {summary.source_type}
            </li>
            {summary.source_title && (
              <li>
                <span className="font-medium">출처 제목:</span>{" "}
                {summary.source_title}
              </li>
            )}
            {summary.source_url && (
              <li>
                <span className="font-medium">URL:</span>{" "}
                <a
                  href={summary.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-all"
                >
                  {summary.source_url}
                </a>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* 요약 내용 */}
      <section>
        <SummaryResult
          text={
            summary.detailed_summary_text ||
            summary.summary_text ||
            "요약 결과가 없습니다."
          }
          tree={convertToTree(summary.diagram_json)}
        />
      </section>

      {/* 원문 보기 */}
      {/* {summary.original_text && (
        <details className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
          <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-200">
            원문 보기
          </summary>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">
            {summary.original_text}
          </pre>
        </details>
      )} */}
    </main>
  );
}
