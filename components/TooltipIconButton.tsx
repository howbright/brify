// components/TooltipIconButton.tsx
import * as Tooltip from "@radix-ui/react-tooltip";
import { Icon } from "@iconify/react";

interface Props {
  title: string;
  icon: string;
  onClick?: () => void;
  className?: string;
}

export default function TooltipIconButton({ title, icon, onClick, className = "" }: Props) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          onClick={onClick}
          className={`p-2 rounded-full bg-primary/10 hover:bg-primary/30 text-gray-700 shadow transition-all duration-300 ${className}`}
        >
          <Icon icon={icon} className="w-5 h-5" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content
        side="top"
        sideOffset={8}
        className="z-150 px-2 py-1 text-xs rounded bg-black text-white shadow-sm"
      >
        {title}
        <Tooltip.Arrow className="fill-black" />
      </Tooltip.Content>
    </Tooltip.Root>
  );
}
