"use client";

import { useTranslations } from "next-intl";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function DiscardDraftDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("DiscardDraftDialog");

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      onConfirm={onConfirm}
      title={t("title")}
      description={t("description")}
      actionLabel={t("actionLabel")}
      tone="danger"
    />
  );
}
