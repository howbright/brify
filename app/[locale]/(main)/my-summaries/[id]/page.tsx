// app/(main)/my-summaries/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SummaryResult from "@/components/SummaryResult";
import { convertToTree } from "@/app/lib/gtp/convertToTree";
import { toast } from "sonner";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// 타입 정의
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface Summary {
  id: string;
  user_id: string | null;
  created_at: string | null;
  source_type: string;
  source_title: string | null;
  source_url: string | null;
  original_text: string | null;
  summary_text: string | null;
  detailed_summary_text: string | null;
  diagram_json: Json | null;
  status: string;
  lang: string | null;
  is_public: boolean | null;
}

export default function SummaryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    fetch(`/api/summaries/${id}`)
      .then(async (res) => {
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
      })
      .catch(() => {
        toast.error("요약을 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton height={30} width={200} />
        <Skeleton count={4} />
      </main>
    );
  }

  if (!summary) return null;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">요약 상세</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          생성일: {summary.created_at ? new Date(summary.created_at).toLocaleString() : "-"}
        </p>
        {summary.source_title && (
          <p className="text-sm">
            📚 <strong>{summary.source_title}</strong>
            {summary.source_url && (
              <a
                href={summary.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:underline"
              >
                원본 링크 ↗
              </a>
            )}
          </p>
        )}
        <p className="text-sm text-gray-500">언어: {summary.lang || "알 수 없음"}</p>
        <p className="text-xs text-blue-600">상태: {summary.status}</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-2">📄 텍스트 요약</h2>
        <SummaryResult
          text={
            summary.detailed_summary_text ||
            summary.summary_text ||
            "요약 결과가 없습니다."
          }
          tree={convertToTree(summary.diagram_json)}
          viewType="text"
        />
      </section>

      {summary.diagram_json && (
        <section>
          <h2 className="text-xl font-semibold mt-12 mb-2">🧠 다이어그램 보기</h2>
          <SummaryResult
            text={
              summary.detailed_summary_text ||
              summary.summary_text ||
              "요약 결과가 없습니다."
            }
            tree={convertToTree(summary.diagram_json)}
            viewType="diagram"
          />
        </section>
      )}

      {summary.original_text && (
        <details className="border rounded p-4 bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
          <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-200">
            원문 보기
          </summary>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">
            {summary.original_text}
          </pre>
        </details>
      )}
    </main>
  );
}
