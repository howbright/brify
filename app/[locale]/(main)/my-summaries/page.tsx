// app/(main)/my-summaries/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react"; // 삭제 아이콘

type SummaryItem = {
  id: string;
  summary_text: string;
  detailed_summary_text: string;
  status: string;
  created_at: string;
};

export default function MySummariesPage() {
  const { session, isLoading } = useSession();
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/login");
    }
  }, [isLoading, session]);

  useEffect(() => {
    if (session?.user.id) {
      fetchSummaries();
    }
  }, [session]);

  const fetchSummaries = async () => {
    const res = await fetch(`/api/summaries?user_id=${session?.user.id}`);
    const data = await res.json();
    setSummaries(data);
  };

  const handleDelete = async (id: string) => {
    const ok = confirm("이 요약을 삭제할까요?");
    if (!ok) return;

    const res = await fetch(`/api/summaries/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setSummaries((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert("삭제에 실패했어요.");
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">나의 스크랩북</h1>
      <ul className="space-y-4">
        {summaries.map((summary) => (
          <li
            key={summary.id}
            className="p-4 border rounded shadow-sm flex justify-between items-start gap-4 group"
          >
            <Link href={`/my-summaries/${summary.id}`} className="flex-1">
              <p className="text-sm text-gray-500">
                {new Date(summary.created_at).toLocaleString()}
              </p>
              <p className="text-base">
                {summary.summary_text || "요약이 아직 없습니다."}
              </p>
              <span className="text-xs text-blue-500">{summary.status}</span>
            </Link>
            <button
              onClick={() => handleDelete(summary.id)}
              className="text-gray-400 hover:text-red-500 transition"
              title="삭제"
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
