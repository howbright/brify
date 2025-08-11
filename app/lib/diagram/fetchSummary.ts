// app/lib/summary/fetchSummary.ts
import { normalizeSummary, type ApiSummary } from "./normalize";
import { toast } from "sonner";
// (선택) router 타입을 쓰고 싶다면: import type { AppRouterInstance } from "next/navigation";

export type FetchSummaryOpts = {
  signal?: AbortSignal;   // 외부 AbortController
  timeoutMs?: number;     // 기본 12초
};

type Deps = {
  setSummary: (v: any) => void;
  setTree: (v: any) => void;
  setNodes: (v: any[]) => void;
  setEdges: (v: any[]) => void;
  setLoading: (v: boolean) => void;
  router: any; // AppRouterInstance 권장
};

/**
 * 요약을 불러오고 상태를 세팅하는 유틸 함수
 */
export async function fetchSummary(
  id: string,
  deps: Deps,
  opts: FetchSummaryOpts = {}
) {
  const { setSummary, setTree, setNodes, setEdges, setLoading, router } = deps;
  const { signal, timeoutMs = 12_000 } = opts;

  // 내부 타임아웃 컨트롤러 (외부 signal과 합성)
  const localController = new AbortController();
  const timer = setTimeout(() => localController.abort("timeout"), timeoutMs);

  if (signal) {
    if (signal.aborted) localController.abort(signal.reason);
    else signal.addEventListener("abort", () => localController.abort(signal.reason), { once: true });
  }

  let aborted = false;

  try {
    setLoading(true);
    console.log("[fetchSummary] 호출:", id);

    const res = await fetch(`/api/summary?id=${encodeURIComponent(id)}`, {
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

    const raw = (await res.json()) as unknown;
    console.log(
      "[fetchSummary] raw keys:",
      raw && typeof raw === "object" ? Object.keys(raw as any) : raw
    );

    // 바로 객체/ data 래핑 둘 다 대응
    const api: ApiSummary =
      raw && (raw as any).diagram_json !== undefined
        ? (raw as ApiSummary)
        : raw && (raw as any).data && (raw as any).data.diagram_json !== undefined
        ? ((raw as any).data as ApiSummary)
        : (raw as ApiSummary);

    const { tree, overlay, nodes, edges } = normalizeSummary(api);

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      toast.error("다이어그램 데이터가 손상되었습니다.");
      return null;
    }

    // 상태 세팅 (null 금지)
    setSummary(api);
    setTree(tree);
    setNodes([...nodes]);
    setEdges([...edges]);

    console.log("[fetchSummary] ready:", {
      tree: tree.length,
      nodes: nodes.length,
      edges: edges.length,
      overlay: !!overlay,
    });

    return api;
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
}
