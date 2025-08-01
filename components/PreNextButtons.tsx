"use client";

import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import * as Tooltip from "@radix-ui/react-tooltip";

interface PrevNextProps {
  prevId?: string | null;
  nextId?: string | null;
}

export default function PrevNextButtons({ prevId, nextId }: PrevNextProps) {
  const router = useRouter();

  return (
    <div className="flex gap-3 items-center">
      {prevId && (
        <Tooltip.Provider delayDuration={100}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => router.push(`/my-summaries/${prevId}`)}
                className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 transition"
                aria-label="Previous"
              >
                <Icon
                  icon="mdi:chevron-left"
                  width={28}
                  height={28}
                  className="text-blue-700"
                />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content
              className="px-2 py-1 text-sm text-white bg-gray-800 rounded shadow-md"
              sideOffset={5}
            >
              이전 글
              <Tooltip.Arrow className="fill-gray-800" />
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      )}

      {nextId && (
        <Tooltip.Provider delayDuration={100}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => router.push(`/my-summaries/${nextId}`)}
                className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 transition"
                aria-label="Next"
              >
                <Icon
                  icon="mdi:chevron-right"
                  width={28}
                  height={28}
                  className="text-blue-700"
                />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content
              className="px-2 py-1 text-sm text-white bg-gray-800 rounded shadow-md"
              sideOffset={5}
            >
              다음 글
              <Tooltip.Arrow className="fill-gray-800" />
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      )}
    </div>
  );
}
