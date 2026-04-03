"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

type UseMapDeletionOptions = {
  updateDrafts: React.Dispatch<React.SetStateAction<MapDraft[]>>;
  onAfterBulkDelete?: () => void;
};

export default function useMapDeletion({
  updateDrafts,
  onAfterBulkDelete,
}: UseMapDeletionOptions) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MapDraft | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const requestDelete = (draft: MapDraft) => {
    setPendingDelete(draft);
    setConfirmOpen(true);
  };

  const handleDelete = async (draft: MapDraft) => {
    if (!draft?.id) return;
    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        throw new Error("세션을 가져오지 못했습니다: " + sessionErr.message);
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error("환경변수 NEXT_PUBLIC_API_BASE_URL이 없습니다.");
      }

      const res = await fetch(`${base}/maps/${draft.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.message || json?.error || "요청 실패";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
      }

      updateDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "삭제에 실패했습니다."));
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      setBulkDeleting(true);
      const res = await fetch("/api/maps/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "요청 실패");
      }

      const deletedIds: string[] = Array.isArray(json?.deleted)
        ? json.deleted
        : [];

      if (deletedIds.length > 0) {
        updateDrafts((prev) => prev.filter((d) => !deletedIds.includes(d.id)));
      }

      const failed = ids.length - deletedIds.length;
      if (failed === 0) {
        toast.success(`${deletedIds.length}개 삭제했습니다.`);
      } else {
        toast.error(`${deletedIds.length}개 삭제, ${failed}개는 실패했습니다.`);
      }
      onAfterBulkDelete?.();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "삭제에 실패했습니다."));
    } finally {
      setBulkDeleting(false);
    }
  };

  const confirmSingleDelete = () => {
    if (!pendingDelete) return;
    setConfirmOpen(false);
    handleDelete(pendingDelete);
    setPendingDelete(null);
  };

  const confirmBulkDelete = (ids: string[]) => {
    setConfirmBulkOpen(false);
    handleBulkDelete(ids);
  };

  return {
    confirmOpen,
    setConfirmOpen,
    confirmBulkOpen,
    setConfirmBulkOpen,
    pendingDelete,
    bulkDeleting,
    requestDelete,
    confirmSingleDelete,
    confirmBulkDelete,
  };
}
