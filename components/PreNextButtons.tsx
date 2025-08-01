"use client";

import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

interface PrevNextProps {
  prevId?: string | null;
  nextId?: string | null;
}

export default function PrevNextButtons({ prevId, nextId }: PrevNextProps) {
  const router = useRouter();

  return (
    <div className="flex gap-3 items-center">
      {prevId && (
        <button
          onClick={() => router.push(`/my-summaries/${prevId}`)}
          className="p-1 rounded-full bg-blue-100 hover:bg-blue-200"
          aria-label="Previous"
        >
          <Icon icon="mdi:chevron-left" width={28} height={28} className="text-blue-700" />
        </button>
      )}
      {nextId && (
        <button
          onClick={() => router.push(`/my-summaries/${nextId}`)}
          className="p-1 rounded-full bg-blue-100 hover:bg-blue-200"
          aria-label="Next"
        >
          <Icon icon="mdi:chevron-right" width={28} height={28} className="text-blue-700"/>
        </button>
      )}
    </div>
  );
}
