import { Icon } from "@iconify/react";

interface FeatureItemProps {
  text: string;
  disabled?: boolean;
}

export default function FeatureItem({
  text,
  disabled = false,
}: FeatureItemProps) {
  return (
    <li>
      <div
        className={`flex items-center gap-2 ${
          disabled ? "text-gray-400 line-through" : ""
        }`}
      >
        <Icon
          icon={
            disabled
              ? "material-symbols:close-rounded"
              : "material-symbols:check-rounded"
          }
          width={24}
          className={disabled ? "text-red-600" : "text-green-400"}
        />
        {text}
      </div>
    </li>
  );
}
