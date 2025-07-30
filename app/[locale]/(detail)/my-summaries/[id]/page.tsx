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
import { useSession } from "@/components/SessionProvider";
import { Icon } from "@iconify/react";
import * as Tabs from "@radix-ui/react-tabs";
import NoteButton from "@/components/NoteButton";

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
  const { session, isLoading } = useSession();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"text" | "diagram">("text");

  const fetchSummary = async (id: string) => {
    let aborted = false;

    try {
      console.log("호출");
      const res = await fetch(`/api/summary?id=${id}`, {
        credentials: "include", // ✅ 이거 꼭 추가
      });
      console.log("status:", res.status);

      if (res.status === 401) {
        toast.error("로그인이 필요합니다.");
        router.push("/login");
        aborted = true;
      } else if (res.status === 403) {
        toast.error("이 요약에 접근할 수 없습니다.");
        router.push("/my-summaries");
        aborted = true;
      } else if (res.status === 404) {
        toast.error("요약을 찾을 수 없습니다.");
        router.push("/my-summaries");
        aborted = true;
      } else if (!res.ok) {
        toast.error("요약을 불러오는 중 오류가 발생했습니다.");
        aborted = true;
      } else {
        // console.log(res)
        const data = await res.json();
        // console.log(data)
        setSummary(data);
      }
    } catch (err) {
      console.error("요약 가져오기 실패:", err);
      toast.error("요약을 불러오는 중 오류가 발생했습니다.");
      setSummary(null);
    } finally {
      if (!aborted) setLoading(false);
    }
  };

  useEffect(() => {
    console.log("useEffect 진입:", id);
    if (session?.user.id) {
      fetchSummary(id);
    }
  }, [session]);

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto p-6 flex flex-col gap-y-6">
        <Skeleton height={30} width={200} />
        <Skeleton count={4} />
      </main>
    );
  }

  if (!summary) return null;

  return (
    <main className="p-6 flex flex-col gap-y-2">
      {/* 요약 제목 */}
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

        {/* 제목 (EditableTitle) + 수정모드 */}
        <div className="flex items-start gap-3 w-full">
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
        </div>

        {/* 메타 정보 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
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
              ? new Date(summary.created_at).toLocaleString(undefined, {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </span>
          {summary.updated_at && (
            <span>
              수정일:{" "}
              {new Date(summary.updated_at).toLocaleString(undefined, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <span>언어: {summary.lang || "알 수 없음"}</span>
          <span>
            출처:{" "}
            {summary.source_url ? (
              <a
                href={summary.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {summary.source_title || summary.source_url}
              </a>
            ) : (
              summary.source_title || summary.source_type
            )}
          </span>
        </div>
      </header>
      {/* === 여기서 탭 === */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
      >
        <Tabs.List className="flex items-center justify-between border-b">
          {/* 왼쪽 탭 버튼 그룹 */}
          <div className="flex gap-2">
            <Tabs.Trigger
              value="text"
              className="px-3 py-1.5 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
            >
              텍스트 보기
            </Tabs.Trigger>
            <Tabs.Trigger
              value="diagram"
              className="px-3 py-1.5 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
            >
              다이어그램 보기
            </Tabs.Trigger>
          </div>

          {/* 오른쪽 코멘트 버튼 */}
          <NoteButton noteCount={4} onClick={()=>{}} />
        </Tabs.List>
      </Tabs.Root>

      {/* <header className="flex flex-col gap-y-2">
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
              ? new Date(summary.created_at).toLocaleString(undefined, {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </span>
          {summary.updated_at && (
            <span>
              수정일:{" "}
              {new Date(summary.updated_at).toLocaleString(undefined, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <span>언어: {summary.lang || "알 수 없음"}</span>
        </div>
      </header> */}

      {/* 메타 정보 */}
      {/* <section className="grid gap-4 md:grid-cols-2">
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
      </section> */}

      {/* 요약 내용 */}
      <section>
        <SummaryResult
          summaryId={id}
          text={summary.detailed_summary_text ?? summary.summary_text ?? ""}
          tree={convertToTree(summary.diagram_json)}
          activeView={activeTab} // header 탭에서 관리하는 상태
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
