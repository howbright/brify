// 📁 components/SummarizeOptionsDialog.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface SummarizeOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (_params: { source: string; viewType: "text" | "diagram" | "both" }) => void;
}

export default function SummarizeOptionsDialog({ open, onClose, onSubmit: _onSubmit }: SummarizeOptionsDialogProps) {
  const [source, setSource] = useState("");
  const [viewType, setViewType] = useState<"text" | "diagram" | "both">("both");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!open) return null;

  const handleSubmit = () => {
    const textarea = document.querySelector("textarea#description") as HTMLTextAreaElement;
    const userText = textarea?.value;
    if (!userText || userText.trim() === "") {
      alert("핵심정리할 글을 입력해주세요.");
      return;
    }

    try {
      localStorage.setItem("brify:latestInput", userText);
      localStorage.setItem("brify:latestSource", source);
    } catch (e) {
      console.warn("로컬스토리지 저장 실패", e);
    }

    setLoading(true);
    onClose();
    router.push(`/result?view=${viewType}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">핵심정리 옵션 선택</h2>

        <label className="block mb-3">
          <span className="text-sm font-medium">출처 (선택)</span>
          <input
            type="text"
            className="mt-1 w-full p-2 rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-700"
            placeholder="예: 유튜브 링크, 뉴스 URL 등"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">핵심정리 결과 보기 방식</p>
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="viewType"
                value="text"
                checked={viewType === "text"}
                onChange={() => setViewType("text")}
              />
              <span className="ml-2">📝 핵심정리 글</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="viewType"
                value="diagram"
                checked={viewType === "diagram"}
                onChange={() => setViewType("diagram")}
              />
              <span className="ml-2">📊 다이어그램</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="viewType"
                value="both"
                checked={viewType === "both"}
                onChange={() => setViewType("both")}
              />
              <span className="ml-2">📝+📊 둘 다</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "핵심정리 중..." : "핵심정리 요청"}
          </button>
        </div>
      </div>
    </div>
  );
}
