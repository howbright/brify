// app/hooks/useSummarizeMutation.ts
import { useMutation } from "@tanstack/react-query";

interface SummarizeRequest {
  originalText: string;
  lang: string;
  sourceType: string;
  sourceUrl: string | null;
  token: string | undefined;
}

interface SummarizeResponse {
  summaryId: string;
}

export function useSummarizeMutation() {
  return useMutation<SummarizeResponse, Error, SummarizeRequest>({
    mutationFn: async (input) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${input.token}`,
        },
        body: JSON.stringify({
          originalText: input.originalText,
          lang: input.lang,
          sourceType: input.sourceType,
          sourceUrl: input.sourceUrl,
          sourceTitle: null,
          isPublic: false,
          publicComment: null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "구조화 요청 실패");
      }

      return result;
    },
  });
}
