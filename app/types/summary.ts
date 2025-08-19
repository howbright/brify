// lib/types/summary.ts
export interface TextSummaryStatus {
    status: "pending" | "partial" | "completed" | "failed";
    detailedSummaryText?: string;
    errorMessage?: string;
  }
  

  export type Keyword = {
    id: number;
    name: string;
    lang: string;
  };