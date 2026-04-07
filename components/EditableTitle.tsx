"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client"; // 상단에서 추가 필요

interface Props {
  id: string;
  initialTitle: string;
  onTitleSaved?: (newTitle: string, updatedAt: string) => void;
}

export default function EditableTitle({
  id,
  initialTitle,
  onTitleSaved: _onTitleSaved,
}: Props) {
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [edited, setEdited] = useState(initialTitle);
  const [loading, setLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(initialTitle);
    setEdited(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [edited, isEditing]);

  const saveTitle = async () => {
    const newTitle = edited.trim();
    if (!newTitle || newTitle === title) {
      setIsEditing(false);
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("summaries")
      .update({ summary_text: newTitle })
      .eq("id", id)
      .select("updated_at")
      .single();

    setLoading(false);
    setIsEditing(false);

    if (error) {
      toast.error("제목 저장 실패");
      setEdited(title); // 원래 제목 복구
      return;
    }

    setTitle(newTitle);
    toast.success("제목이 저장되었습니다.");
    // onTitleSaved?.(newTitle, data.updated_at);
  };

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="w-full flex items-start gap-5">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            autoFocus
            rows={1}
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                saveTitle();
              }
            }}
            className="w-full text-xl font-bold border-b border-gray-300 px-2 py-1 resize-none leading-snug focus:outline-none"
            placeholder="제목을 입력하세요"
          />
        ) : (
          <h1 className="text-xl font-bold whitespace-pre-wrap">
            {title || "제목 없는 구조화"}
          </h1>
        )}

        {/* 수정 버튼은 항상 우측에 고정 */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="ml-2 mt-1 hover:scale-105 transition"
            disabled={loading}
            title="제목 수정"
          >
            {loading ? (
              <Icon
                icon="line-md:loading-twotone-loop"
                className="w-5 h-5 text-gray-400 animate-spin"
              />
            ) : (
              <Icon
                icon="mdi:pencil-outline"
                className="w-5 h-5 text-gray-500 hover:text-gray-700"
              />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
