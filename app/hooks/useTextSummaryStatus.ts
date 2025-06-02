import { useQuery } from "@tanstack/react-query";
import { TextSummaryStatus } from "../types/summary";

export function useTextSummaryStatus(summaryId: string | null) {
    return useQuery<TextSummaryStatus>({
      queryKey: ["text-summary-status", summaryId],
      queryFn: async () => {
        const res = await fetch(`/api/status/text/${summaryId}`);
        const parsed = await res.json().catch(() => null);
  
        if (!res.ok) {
          throw new Error(parsed?.error || "알 수 없는 서버 오류");
        }
  
        return parsed;
      },
      enabled: typeof summaryId === "string" && summaryId.trim().length > 0,
      refetchInterval: (query) =>
        !query.state.data || query.state.data.status === "pending" ? 2000 : false,
      retry: false,
      refetchOnWindowFocus: false,
    });
  }
  