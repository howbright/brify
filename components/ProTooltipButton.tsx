import * as Tooltip from "@radix-ui/react-tooltip";
import { useRouter } from "next/navigation";

export function ProTooltipButton({ label }: { label: string }) {
  const router = useRouter();

  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            disabled
            className="cursor-not-allowed opacity-50 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            {label}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content
          side="top"
          className="z-50 max-w-xs p-3 rounded-lg bg-white dark:bg-gray-900 shadow-lg border text-sm text-gray-800 dark:text-gray-200 space-y-2"
        >
          <p>Pro 사용자만 이용할 수 있어요.</p>
          <button
            onClick={() => router.push("/pricing")}
            className="text-primary font-semibold underline hover:text-primary-dark"
          >
            Pro로 업그레이드 →
          </button>
          <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
