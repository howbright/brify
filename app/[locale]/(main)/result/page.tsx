// 📁 app/[locale]/(main)/result/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SummaryResult from "@/components/SummaryResult";
import { TreeNode } from "@/app/types/tree";
import { summarizeAndGenerateTree, summarizeTextOnly } from "@/app/lib/gtp/summarize";

export default function ResultPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState<string>("");
  const [tree, setTree] = useState<TreeNode | null>(null);

  const searchParams = useSearchParams();
  const viewType = (searchParams.get("view") ?? "both") as
    | "text"
    | "diagram"
    | "both";

  useEffect(() => {
    setMounted(true);

    const input = localStorage.getItem("brify:latestInput") || "";
    const source = localStorage.getItem("brify:latestSource") || "";

    const fetchSummary = async () => {
      const summaryText = await summarizeTextOnly(input);
      const summarizeTree = await summarizeAndGenerateTree(input);
      setText(summaryText);
      setTree(summarizeTree); // 실제 API 호출 시 summarizeAndGenerateTree(input)
      setLoading(false);
    };

    fetchSummary();
  }, []);

  if (!mounted) return null;

  if (loading) {
    return <p className="p-10 text-center">요약 중입니다... ⏳</p>;
  }

  return (
    <SummaryResult viewType={viewType} text={text} tree={tree ?? undefined} />
  );
}
