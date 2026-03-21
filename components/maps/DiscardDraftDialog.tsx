"use client";

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
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      onConfirm={onConfirm}
      title="임시 변경 버리기"
      description="임시 변경사항을 모두 삭제하고 마지막 발행본으로 돌아갈까요?"
      actionLabel="버리기"
      tone="danger"
    />
  );
}
