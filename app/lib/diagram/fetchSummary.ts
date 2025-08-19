// app/lib/summary/fetchSummary.ts
import { toast } from "sonner";
import { normalizeSummary, type ApiSummary } from "./normalize";
import type { MyFlowNode, MyFlowEdge, TreeNode } from "@/app/types/diagram";

export type FetchSummaryOpts = {
  signal?: AbortSignal;   // 외부 AbortController
  timeoutMs?: number;     // 기본 12초
};

type Deps = {
  setSummary: (v: ApiSummary | null) => void;
  setTree: (v: TreeNode[]) => void;
  setNodes: (v: MyFlowNode[]) => void;
  setEdges: (v: MyFlowEdge[]) => void;
  setLoading: (v: boolean) => void;
  router: any; // AppRouterInstance 권장
};

export async function fetchSummary(
  id: string,
  deps: Deps,
  opts: FetchSummaryOpts = {}
) {
  const { setSummary, setTree, setNodes, setEdges, setLoading, router } = deps;
  const { signal, timeoutMs = 12_000 } = opts;

  const localController = new AbortController();
  const timer = setTimeout(() => localController.abort("timeout"), timeoutMs);

  if (signal) {
    if (signal.aborted) localController.abort(signal.reason);
    else signal.addEventListener("abort", () => localController.abort(signal.reason), { once: true });
  }

  let aborted = false;

  try {
    setLoading(true);
    const res = await fetch(`/api/summary?id=${encodeURIComponent(id)}`, {
      credentials: "include",
      signal: localController.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

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

    const api = (await res.json()) as ApiSummary;
    const { tree, nodes, edges } = await normalizeSummary(api);

    setSummary(api);
    setTree(tree ?? []);
    setNodes(nodes ?? []);
    setEdges(edges ?? []);

    return api;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      // 라우트 변경/언마운트 중 취소: 조용히 무시
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
