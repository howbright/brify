"use client";

import { useSession } from "@/components/SessionProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useRouter } from "next/navigation";

export function ProTooltipButton({ label }: { label: string }) {
  const { session } = useSession();
  const router = useRouter();

  const isPro = session?.user?.user_metadata?.role === "pro";

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              if (!isPro) return;
            }}
            className="relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white border border-gray-300 text-black hover:border-black cursor-pointer"
          >
            {label}
            <span className="absolute -top-2 -right-2 bg-pink-600 text-[10px] font-bold text-white px-1.5 py-[1px] rounded-full shadow-sm">
              PRO
            </span>
          </button>
        </TooltipTrigger>

        {!isPro && (
          <TooltipContent
            side="top"
            className="text-sm bg-primary-50 text-primary border border-primary px-4 py-2 rounded-lg shadow-xl w-max flex flex-col gap-1"
          >
            <p className="font-medium">Pro 요금제에서 사용할 수 있어요.</p>
            <button
              onClick={() => router.push("/pricing")}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1 rounded transition"
            >
              요금제 보러가기
            </button>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
