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
import SummaryHeader from "@/components/SummaryHeader";
import { Category } from "@/lib/enums/categories.enum";

// 타입 정의
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Keyword {
  id: number;
  name: string;
  lang: string;
}

export interface Summary {
  id: string;
  user_id: string | null;
  created_at: string | null;
  source_type: string;
  source_title: string | null;
  source_url: string | null;
  summary_text: string | null;
  detailed_summary_text: string | null;
  diagram_json: Json | null;
  status: string;
  lang: string | null;
  is_public: boolean | null;
  updated_at: string | null;
  category: Category | null; // enum Category를 쓴다면 Category 타입으로 바꿀 수도 있음
  keywords: Keyword[]; // keywords 목록 추가
}

export default function SummaryDetailPage() {
  const { session, isLoading } = useSession();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"text" | "diagram">("text");
  const [isFullMode, setFullMode] = useState<boolean>(false);

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
      {!isFullMode && summary && (
        <SummaryHeader
          id={summary.id}
          title={summary.summary_text || "제목 없는 요약"}
          // status={summary.status}
          createdAt={summary.created_at}
          updatedAt={summary.updated_at}
          lang={summary.lang}
          sourceTitle={summary.source_title}
          sourceUrl={summary.source_url}
          sourceType={summary.source_type}
          category={summary.category}
          tags={summary.keywords}
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
      )}
      {/* === 여기서 탭 === */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
      >
        <Tabs.List className="flex items-center justify-between">
          {/* 왼쪽 탭 버튼 그룹 */}
          <div className="flex gap-2">
            <Tabs.Trigger
              value="text"
              className="
        px-4 py-2 rounded-full text-sm font-medium transition
        data-[state=active]:bg-blue-600 data-[state=active]:text-white
        data-[state=inactive]:bg-blue-100 data-[state=inactive]:text-blue-700
        data-[state=inactive]:hover:bg-blue-200  data-[state=active]:hover:bg-blue-700
      "
            >
              텍스트 보기
            </Tabs.Trigger>

            <Tabs.Trigger
              value="diagram"
              className="
        px-4 py-2 rounded-full text-sm font-medium transition
        data-[state=active]:bg-blue-600 data-[state=active]:text-white
        data-[state=inactive]:bg-blue-100 data-[state=inactive]:text-blue-700
       data-[state=inactive]:hover:bg-blue-200  data-[state=active]:hover:bg-blue-700
      "
            >
              다이어그램 보기
            </Tabs.Trigger>
          </div>

          {/* 오른쪽 코멘트 버튼 */}
          <div className="flex flex-row items-center gap-2">
            <NoteButton noteCount={4} onClick={() => {}} />
            {isFullMode ? (
              <button
                onClick={() => {
                  setFullMode(false);
                }}
                className="flex flex-row items-center gap-2 py-1 px-3 rounded-full  bg-white shadow hover:bg-gray-100"
              >
                <Icon
                  icon="mdi:fullscreen-exit"
                  className="w-5 h-5 text-gray-700"
                />
                닫기
              </button>
            ) : (
              <button
                onClick={() => {
                  setFullMode(true);
                }}
                title="전체 보기"
                className="flex flex-row items-center gap-2 p-1 rounded-full bg-blue-100 text-blue-700 shadow hover:border hover:border-blue-700"
              >
                <Icon icon="mdi:fullscreen" className="w-7 h-7 text-blue-700" />
              </button>
            )}
          </div>
        </Tabs.List>
      </Tabs.Root>

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
