import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface NoteButtonProps {
  noteCount: number;
  onClick: () => void;
}

export default function NoteButton({ noteCount, onClick }: NoteButtonProps) {
  const t = useTranslations("NoteButton");
  const hasNotes = noteCount > 0;
  const label = hasNotes
    ? t("withCount", { count: noteCount })
    : t("label");

  return (
    <button
      onClick={onClick}
      title={t("label")}
      className={`
          flex items-center gap-1 px-3 py-1.5 shadow rounded-full transition
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
        {label}
      </span>
    </button>
  );
}
