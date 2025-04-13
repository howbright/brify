"use client";

import { Icon } from "@iconify/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useState } from "react";

interface Props {
  tags: string[];
  onChange: (newTags: string[]) => void;
}

export default function EditableTags({ tags, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newTag, setNewTag] = useState("");
  const [editValue, setEditValue] = useState("");

  const handleDelete = (index: number) => {
    const updated = [...tags];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(tags[index]);
  };

  const handleEditSubmit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const updated = [...tags];
      updated[editingIndex] = editValue.trim();
      onChange(updated);
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setNewTag("");
    }
  };

  return (
      <div className="flex flex-wrap gap-2 items-center">
        {tags.map((tag, index) =>
          editingIndex === index ? (
            <input
              key={index}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleEditSubmit()}
              autoFocus
              className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-black text-gray-800 dark:text-white"
            />
          ) : (
            <Tooltip.Root key={index}>
              <Tooltip.Trigger asChild>
                <div
                  className="flex items-center bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white text-sm px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-white/20"
                  onDoubleClick={() => handleEdit(index)}
                >
                  <span>{tag}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(index);
                    }}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    <Icon icon="mdi:close" width={14} />
                  </button>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="top"
                  className="bg-black text-white text-xs rounded px-2 py-1 shadow-md"
                >
                  더블 클릭하여 수정
                  <Tooltip.Arrow className="fill-black" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )
        )}

        {/* 태그 추가 input + 툴팁 버튼 */}
        <div className="flex items-center gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            placeholder="태그 추가"
            className="px-3 py-1 text-sm rounded-full border border-gray-300 dark:border-white/20 bg-white dark:bg-black text-gray-800 dark:text-white"
          />
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={handleAddTag}
                className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
              >
                <Icon icon="mdi:plus-circle-outline" width={22} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="top"
                className="bg-black text-white text-xs rounded px-2 py-1 shadow-md"
              >
                태그 추가
                <Tooltip.Arrow className="fill-black" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </div>
  );
}
