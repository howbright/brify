import { Icon } from "@iconify/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function ActionMenu({
  isEditing,
  onEditToggle,
  onCommentClick,
  onSave,
  showSave = false,
}: {
  isEditing: boolean;
  onEditToggle: () => void;
  onCommentClick: () => void;
  onSave: () => void;
  showSave?: boolean;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Icon icon="mdi:dots-vertical" className="w-5 h-5 text-gray-700" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={4}
          className="bg-white border shadow-md rounded-md p-1 min-w-[120px]"
        >
          <DropdownMenu.Item
            className="px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
            onClick={onEditToggle}
          >
            {isEditing ? "편집 취소" : "✏️ 수정"}
          </DropdownMenu.Item>

          {showSave && (
            <DropdownMenu.Item
              className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer"
              onClick={onSave}
            >
              💾 저장
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Item
            className="px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
            onClick={onCommentClick}
          >
            💬 코멘트로 이동
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
