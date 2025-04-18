"use client";

interface Props {
  value: string;
  onChange: (text: string) => void;
}

export default function ExtractedText({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2 p-6 bg-background rounded-2xl">
      <label className="block text-sm font-semibold text-gray-800 dark:text-white">
        원문 내용
      </label>
      <textarea
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 dark:border-white/20 p-4 rounded-lg bg-white dark:bg-black text-sm text-gray-800 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-primary"
        placeholder="추출된 내용을 확인하거나 수정할 수 있습니다."
      />
    </div>
  );
}
