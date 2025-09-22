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
  console.log("fetchSummary 함수 내부에 들어옴");
  const { setSummary, setTree, setNodes, setEdges, setLoading, router } = deps;
  const { signal, timeoutMs = 12_000 } = opts;

  const localController = new AbortController();
  const timer = setTimeout(() => localController.abort("timeout"), timeoutMs);

  if (signal) {
    if (signal.aborted) localController.abort(signal.reason ?? "outer-abort");
    else signal.addEventListener(
      "abort",
      () => localController.abort(signal.reason ?? "outer-abort"),
      { once: true }
    );
  }

  let aborted = false;

  // 취소/타임아웃/라우트체인지 판별 유틸
  const isAbortLike = (err: unknown) => {
    // 표준 AbortError
    if (err && typeof err === "object" && "name" in err && (err as any).name === "AbortError") return true;
    // 일부 런타임(undici/브라우저)에서 code 사용
    if (err && typeof err === "object" && "code" in err && (err as any).code === "ABORT_ERR") return true;
    // Next/브라우저에서 reason 문자열을 그대로 throw 하는 경우
    if (err === "route change" || err === "timeout" || err === "outer-abort") return true;
    return false;
  };

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
          aborted = true; // 이후 setLoading(false) 방지
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
    console.log('API에서 받은 직후의 tree 데이터 :', api);

    // normalize에서 에러 나도 전체가 터지지 않게 보호
    let tree: TreeNode[] = [];
    let nodes: MyFlowNode[] = [];
    let edges: MyFlowEdge[] = [];
    try {
      const out = await normalizeSummary(api);
      console.log('API에서 받은 직후의 tree 데이터를 nomalizeSummary한 결과 :', out);
      tree = out.tree ?? [];
      nodes = out.nodes ?? [];
      edges = out.edges ?? [];
    } catch (e) {
      console.error("[normalizeSummary] 실패:", e);
      toast.error("다이어그램 데이터를 해석하는 중 오류가 발생했습니다.");
    }

    setSummary(api);
    setTree(tree);
    setNodes(nodes);
    setEdges(edges);

    return api;
  } catch (err: any) {
    if (isAbortLike(err)) {
      // 라우트 변경/타임아웃/외부 취소: 조용히 무시
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
