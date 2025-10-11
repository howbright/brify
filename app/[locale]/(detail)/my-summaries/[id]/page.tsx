// app/(main)/my-summaries/[id]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Icon } from "@iconify/react";

import { useSession } from "@/components/SessionProvider";
import SummaryHeader from "@/components/SummaryHeader";
import SummaryResult from "@/components/SummaryResult";
import NoteButton from "@/components/NoteButton";
import { Category } from "@/lib/enums/categories.enum";

import type {
  MyFlowNode,
  MyFlowEdge,
  TreeNode,
  ReactFlowState,
  OriginalDiagram,
} from "@/app/types/diagram";
import { isFlowState, isOriginal } from "@/app/types/diagram";
import { ApiSummary } from "@/app/lib/diagram/normalize";
import { fetchSummary } from "@/app/lib/diagram/fetchSummary";

export type DiagramSource = "overlay" | "original" | "none";
interface Keyword {
  id: number;
  name: string;
  lang: string;
}

export default function SummaryDetailPage() {
  const { session } = useSession();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [nodes, setNodes] = useState<MyFlowNode[]>([]);
  const [edges, setEdges] = useState<MyFlowEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"text" | "diagram">("diagram");
  const [isFullMode, setFullMode] = useState<boolean>(false);

  // Abort/race 제어
  const requestRef = useRef(0);

  useEffect(() => {
    if (!id || !session?.user?.id) return;
    const reqId = ++requestRef.current;
    const ac = new AbortController();

    fetchSummary(
      id,
      {
        setSummary,
        setTree,
        setNodes,
        setEdges,
        setLoading,
        router,
      },
      { signal: ac.signal, timeoutMs: 12_000 }
    );

    return () => {
      if (reqId === requestRef.current) ac.abort("route change");
    };
  }, [id, session?.user?.id, router]);

  // 파생값: flowState(우선), flat original(백업)
  const flowState: ReactFlowState | null = useMemo(() => {
    const eff = summary?.effective_diagram_json;
    return isFlowState(eff)
      ? eff
      : summary?.temp_diagram_json && isFlowState(summary.temp_diagram_json)
      ? summary.temp_diagram_json
      : null;
  }, [summary]);

  const original: OriginalDiagram | null = useMemo(() => {
    const eff = summary?.effective_diagram_json;
    if (isOriginal(eff)) return eff;
    if (
      summary?.original_diagram_json &&
      isOriginal(summary.original_diagram_json)
    )
      return summary.original_diagram_json;
    return null;
  }, [summary]);

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
    <main className="p-6 flex flex-col gap-y-2">
      {!isFullMode && (
        <SummaryHeader
          id={summary.id}
          title={summary.summary_text || "제목 없는 요약"}
          createdAt={summary.created_at}
          updatedAt={summary.updated_at}
          lang={summary.lang}
          sourceTitle={summary.source_title}
          sourceUrl={summary.source_url}
          sourceType={summary.source_type}
          category={summary.category as Category | null}
          tags={summary.keywords as Keyword[]}
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

      <Tabs.Root
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
      >
        <Tabs.List className="flex items-center justify-between">
          <div className="flex gap-2">
            <Tabs.Trigger
              value="diagram"
              className="px-4 py-2 rounded-full text-sm font-medium transition
                data-[state=active]:bg-blue-600 data-[state=active]:text-white
                data-[state=inactive]:bg-blue-100 data-[state=inactive]:text-blue-700
                data-[state=inactive]:hover:bg-blue-200 data-[state=active]:hover:bg-blue-700"
            >
              다이어그램 보기
            </Tabs.Trigger>
            <Tabs.Trigger
              value="text"
              className="px-4 py-2 rounded-full text-sm font-medium transition
                data-[state=active]:bg-blue-600 data-[state=active]:text-white
                data-[state=inactive]:bg-blue-100 data-[state=inactive]:text-blue-700
                data-[state=inactive]:hover:bg-blue-200 data-[state=active]:hover:bg-blue-700"
            >
              텍스트 보기
            </Tabs.Trigger>
          </div>

          <div className="flex flex-row items-center gap-2">
            <NoteButton noteCount={4} onClick={() => {}} />
            {isFullMode ? (
              <button
                onClick={() => setFullMode(false)}
                className="flex flex-row items-center gap-2 p-1 rounded-full bg-blue-100 text-blue-700 shadow hover:bg-blue-200"
              >
                <Icon
                  icon="mdi:fullscreen-exit"
                  className="w-7 h-7 text-blue-700"
                />
              </button>
            ) : (
              <button
                onClick={() => setFullMode(true)}
                title="전체 보기"
                className="flex flex-row items-center gap-2 p-1 rounded-full bg-blue-100 text-blue-700 shadow hover:bg-blue-200"
              >
                <Icon icon="mdi:fullscreen" className="w-7 h-7 text-blue-700" />
              </button>
            )}
          </div>
        </Tabs.List>
      </Tabs.Root>

      <section>
        <SummaryResult
          summaryId={id}
          text={summary.detailed_summary_text ?? summary.summary_text ?? ""}
          diagram={summary.effective_diagram_json} // ✅ 항상 reactflow
          activeView={activeTab}
        />
      </section>
    </main>
  );
}
