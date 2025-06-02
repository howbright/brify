import { useQuery, Query } from "@tanstack/react-query";

interface KeywordStatusResponse {
  status: "pending" | "partial" | "completed" | "failed";
  keywords?: string[];
  errorMessage?: string | null;
}

function determineRefetchInterval(query: Query<KeywordStatusResponse>) {
  const data = query.state.data;
  if (!data) return 3000;
  return data.status === "completed" || data.status === "failed" ? false : 3000;
}

export function useKeywordStatus(summaryId: string | null) {
  const enabled = !!summaryId;

  return useQuery<KeywordStatusResponse>({
    queryKey: ["keyword-status", summaryId],
    queryFn: async () => {
      const res = await fetch(`/api/status/keywords/${summaryId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "키워드 상태 가져오기 실패");
      }
      return data;
    },
    enabled,
    refetchInterval: determineRefetchInterval,
    refetchIntervalInBackground: true,
    retry: false,
  });
}
