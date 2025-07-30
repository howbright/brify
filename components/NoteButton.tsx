import { Icon } from "@iconify/react";

interface NoteButtonProps {
  noteCount: number;
  onClick: () => void;
}

export default function NoteButton({ noteCount, onClick }: NoteButtonProps) {
  const hasNotes = noteCount > 0;

  return (
    <button
      onClick={onClick}
      title="노트"
      className={`
          flex items-center gap-1 px-3 py-1.5 rounded-full shadow transition
          ${
            hasNotes
              ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          }
        `}
    >
      <Icon
        icon={hasNotes ? "mdi:notebook-check-outline" : "mdi:notebook-outline"}
        className="w-5 h-5"
      />
      <span className="text-sm font-medium">
        노트{hasNotes ? ` (${noteCount})` : ""}
      </span>
    </button>
  );
}
