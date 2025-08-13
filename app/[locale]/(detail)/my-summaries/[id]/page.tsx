// app/(main)/my-summaries/[id]/page.tsx
"use client";

import { convertToTree } from "@/app/lib/gtp/convertToTree";
import NoteButton from "@/components/NoteButton";
import { useSession } from "@/components/SessionProvider";
import SummaryHeader from "@/components/SummaryHeader";
import SummaryResult from "@/components/SummaryResult";
import { Category } from "@/lib/enums/categories.enum";
import { Icon } from "@iconify/react";
import * as Tabs from "@radix-ui/react-tabs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import type { OriginalDiagram, Overlay } from "@/app/types/diagram";

// 응답 타입
export type DiagramSource = "overlay" | "original";

export interface Keyword {
  id: number;
  name: string;
  lang: string;
}

export interface SummaryResponse {
  id: string;
  user_id: string | null;
  created_at: string | null;

  source_type: string;
  source_title: string | null;
  source_url: string | null;

  summary_text: string | null;
  detailed_summary_text: string | null;

  diagram_json: OriginalDiagram | null;
  original_text?: string | null;

  status: string;
  lang: string | null;
  is_public: boolean | null;
  updated_at: string | null;

  category: Category | null;
  keywords: Keyword[];

  original_diagram_json: OriginalDiagram | null;
  temp_diagram_json: Overlay | null;
  effective_diagram_json: OriginalDiagram | Overlay | null;
  diagram_source: DiagramSource;
}

// 타입가드
export function isOverlay(
  d: OriginalDiagram | Overlay | null | undefined
): d is Overlay {
  return !!d && typeof d === "object" && Array.isArray((d as any).nodes) && Array.isArray((d as any).edges);
}
export function isOriginal(
  d: OriginalDiagram | Overlay | null | undefined
): d is OriginalDiagram {
  return Array.isArray(d);
}

export default function SummaryDetailPage() {
  const { session, isLoading } = useSession();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"text" | "diagram">("diagram");
  const [isFullMode, setFullMode] = useState<boolean>(false);

  // race 방지 토큰
  const requestRef = useRef(0);

  // ---- fetch (페이지에서만) ----
  type FetchSummaryOpts = { signal?: AbortSignal; timeoutMs?: number };

  const fetchSummary = async (sid: string, opts: FetchSummaryOpts = {}) => {
    const { signal, timeoutMs = 12_000 } = opts;

    const reqId = ++requestRef.current;
    const localController = new AbortController();
    const timer = setTimeout(() => localController.abort("timeout"), timeoutMs);

    if (signal) {
      if (signal.aborted) localController.abort(signal.reason);
      else signal.addEventListener("abort", () => localController.abort(signal.reason), { once: true });
    }

    let aborted = false;

    try {
      setLoading(true);
      console.log("[fetchSummary] 호출:", sid);

      const res = await fetch(`/api/summary?id=${encodeURIComponent(sid)}`, {
        credentials: "include",
        signal: localController.signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      console.log("[fetchSummary] status:", res.status);

      if (!res.ok) {
        switch (res.status) {
          case 401:
            toast.error("로그인이 필요합니다.");
            router.push("/login");
            aborted = true;
            break;
          case 403:
            toast.error("이 요약에 접근할 수 없습니다.");
            router.push("/my-summaries");
            aborted = true;
            break;
          case 404:
            toast.error("요약을 찾을 수 없습니다.");
            router.push("/my-summaries");
            aborted = true;
            break;
          default: {
            let msg = "요약을 불러오는 중 오류가 발생했습니다.";
            try {
              const errJson = await res.clone().json().catch(() => null);
              if (errJson?.message) msg = String(errJson.message);
            } catch {}
            toast.error(msg);
            aborted = true;
          }
        }
        return null;
      }

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        toast.error("서버 응답 형식이 올바르지 않습니다.");
        return null;
      }

      const data = (await res.json()) as SummaryResponse;
      console.log("[fetchSummary] raw keys:", Object.keys(data || {}));

      // race 방지: 가장 최근 호출만 반영
      if (reqId === requestRef.current) {
        setSummary(data);
      }

      return data;
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.warn("[fetchSummary] 요청이 취소됨:", err?.message || err);
        aborted = true;
        return null;
      }
      console.error("[fetchSummary] 실패:", err);
      toast.error("요약을 불러오는 중 오류가 발생했습니다.");
      setSummary(null);
      return null;
    } finally {
      clearTimeout(timer);
      if (!aborted) setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !session?.user?.id) return;
    const ac = new AbortController();
    fetchSummary(id, { signal: ac.signal, timeoutMs: 12_000 });
    return () => ac.abort("route change");
  }, [id, session?.user?.id]);

  // ---- 파생값: overlay 최우선 ----
  const { flatList, overlay } = useMemo(() => {
    if (!summary) return { flatList: null as any, overlay: null as any };

    const effective = summary.effective_diagram_json;

    const flatList = isOriginal(effective)
      ? effective
      : summary.original_diagram_json ?? null;

    const overlay = isOverlay(effective) ? effective : null;

   //console.log("overlay:", overlay ? { n: overlay.nodes?.length, e: overlay.edges?.length } : null);
    return { flatList, overlay };
  }, [summary]);

  const tree = useMemo(() => {
    console.log("flatList::", flatList);
    return flatList ? convertToTree(flatList) : null;
  }, [flatList]);

  // ---- 로딩/널 처리 ----
  if (isLoading || loading) {
    return (
      <main className="max-w-4xl mx-auto p-6 flex flex-col gap-y-6">
        <Skeleton height={30} width={200} />
        <Skeleton count={4} />
      </main>
    );
  }

  if (!summary) return null;

  // ---- 렌더 ----
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

      <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
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

            {/* {summary.original_text && (
              <Tabs.Trigger
                value="original"
                className="px-4 py-2 rounded-full text-sm font-medium transition
                  data-[state=active]:bg-gray-600 data-[state=active]:text-white
                  data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
                  data-[state=inactive]:hover:bg-gray-200 data-[state=active]:hover:bg-gray-700"
              >
                원문 보기
              </Tabs.Trigger>
            )} */}
          </div>

          <div className="flex flex-row items-center gap-2">
            <NoteButton noteCount={4} onClick={() => {}} />
            {isFullMode ? (
              <button
                onClick={() => setFullMode(false)}
                className="flex flex-row items-center gap-2 p-1 rounded-full bg-blue-100 text-blue-700 shadow hover:bg-blue-200"
              >
                <Icon icon="mdi:fullscreen-exit" className="w-7 h-7 text-blue-700" />
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
          tree={tree}
          overlay={overlay}
          activeView={activeTab}
        />
      </section>
    </main>
  );
}
