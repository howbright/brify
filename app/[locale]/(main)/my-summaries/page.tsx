"use client";

import { useSession } from "@/components/SessionProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Category, categoryColors } from "@/lib/enums/categories.enum";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

type SummaryItem = {
  id: string;
  summary_text: string;
  detailed_summary_text: string;
  status: string;
  tags?: string[];
  created_at: string;
  category?: Category | null;
};



export default function MySummariesPage() {
  const { session, isLoading } = useSession();
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    const res = await fetch("/api/summary", {
      credentials: "include",
      method: "DELETE",
      body: JSON.stringify({ id: deleteTargetId }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      setSummaries((prev) => prev.filter((s) => s.id !== deleteTargetId));
      toast.success("삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했어요.");
    }

    setDialogOpen(false);
    setDeleteTargetId(null);
  };

  const handleClick = (id: string) => {
    setLoadingId(id);
    startTransition(() => {
      router.push(`/my-summaries/${id}`);
    });
  };

  return (
    <main className="max-w-7xl mx-auto p-6 lg:pt-14 space-y-6">
      <h1 className="text-2xl font-bold mb-4">나의 스크랩북</h1>
      <ul className="space-y-4">
        {summaries.map((summary) => {
          const category = summary.category || Category.OTHER;
          return (
            <li
              key={summary.id}
              className={`relative p-5 rounded-2xl border border-gray-200 bg-white shadow-md transition-shadow duration-200 flex justify-between items-start gap-4 group ${
                loadingId === summary.id
                  ? "opacity-50 cursor-wait pointer-events-none"
                  : "hover:shadow-lg cursor-pointer"
              }`}
              onClick={() => handleClick(summary.id)}
            >
              {/* 책갈피 라벨 */}
              <div
                className={`absolute -top-2 left-4 px-3 py-0.5 text-xs font-bold text-white rounded-t-md ${categoryColors[category]}`}
              >
                {category.replace("_", " ")}
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">
                  {new Date(summary.created_at).toLocaleString()}
                </p>

                <p className="text-base font-medium text-gray-800 line-clamp-3">
                  {summary.summary_text || "요약이 아직 없습니다."}
                </p>

                {!!summary.tags && summary.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {summary.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-blue-100 text-blue-700 rounded-full px-3 py-0.5 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {/* <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      summary.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : summary.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {summary.status}
                  </span> */}

                  {loadingId === summary.id && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTargetId(summary.id);
                  setDialogOpen(true);
                }}
                className="text-gray-400 hover:text-red-500 transition"
                title="삭제"
              >
                <Trash2 size={18} />
              </button>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleDelete}
        title="요약을 삭제할까요?"
        description="삭제하면 복구할 수 없습니다."
        actionLabel="삭제"
      />
    </main>
  );
}
