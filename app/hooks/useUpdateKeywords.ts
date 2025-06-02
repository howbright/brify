// app/hooks/useUpdateKeywords.ts
import { useMutation } from "@tanstack/react-query";

interface UpdateKeywordsInput {
  summaryId: string;
  keywords: string[];
}

interface UpdateKeywordsResponse {
  success: boolean;
}

export function useUpdateKeywords() {
  return useMutation<UpdateKeywordsResponse, Error, UpdateKeywordsInput>({
    mutationFn: async ({ summaryId, keywords }) => {
      const res = await fetch("/api/keywords/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryId, keywords }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "키워드 업데이트 실패");
      }

      return result;
    },
  });
}
