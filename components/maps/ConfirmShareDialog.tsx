"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function ConfirmShareDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      onConfirm={onConfirm}
      title="발행 후 공유"
      description="현재 변경사항을 발행하고 공유 링크를 생성할까요?"
      actionLabel="발행 후 공유"
      tone="primary"
    />
  );
}
