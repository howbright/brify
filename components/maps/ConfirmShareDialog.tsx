"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useLocale, useMessages } from "next-intl";

type ConfirmShareMessages = {
  title?: string;
  description?: string;
  actionLabel?: string;
};

export default function ConfirmShareDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const locale = useLocale();
  const messages = useMessages() as {
    ConfirmShareDialog?: ConfirmShareMessages;
  };
  const fallback =
    locale === "ko"
      ? {
          title: "발행 후 공유",
          description: "현재 변경사항을 발행하고 공유 링크를 생성할까요?",
          actionLabel: "발행 후 공유",
        }
      : {
          title: "Publish before sharing",
          description: "Publish the current changes and generate a share link?",
          actionLabel: "Publish and share",
        };
  const copy = {
    title: messages.ConfirmShareDialog?.title ?? fallback.title,
    description:
      messages.ConfirmShareDialog?.description ?? fallback.description,
    actionLabel:
      messages.ConfirmShareDialog?.actionLabel ?? fallback.actionLabel,
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      onConfirm={onConfirm}
      title={copy.title}
      description={copy.description}
      actionLabel={copy.actionLabel}
      tone="primary"
    />
  );
}
