// lib/types/summary.ts
export interface TextSummaryStatus {
    status: "pending" | "partial" | "completed" | "failed";
    detailedSummaryText?: string;
    errorMessage?: string;
  }
  