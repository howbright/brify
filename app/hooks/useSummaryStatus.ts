import { useQuery, Query } from "@tanstack/react-query";

interface SummaryStatus {
  status: "pending" | "partial" | "completed" | "failed";
  summaryText?: string;
  detailedSummaryText?: string;
  treeSummary?: any;
  errorMessage?: string;
}

function determineRefetchInterval(query: Query<SummaryStatus>) {
  const data = query.state.data;
  return !data || data.status === "pending" ? 2000 : false;
}

export function useSummaryStatus(summaryId: string | null) {
  return useQuery<SummaryStatus>({
    queryKey: ["summary-status", summaryId],
    queryFn: async () => {
      const res = await fetch(`/api/status/${summaryId}`);
      const parsed = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(parsed?.error || "알 수 없는 서버 오류");
      }

      return parsed;
    },
    enabled: typeof summaryId === "string" && summaryId.trim().length > 0,
    refetchInterval: determineRefetchInterval,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
