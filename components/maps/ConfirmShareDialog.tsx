"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useTranslations } from "next-intl";

export default function ConfirmShareDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("ConfirmShareDialog");

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
      cancelLabel={t("cancelLabel")}
      tone="primary"
    />
  );
}
