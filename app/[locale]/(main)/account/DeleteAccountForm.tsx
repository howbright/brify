"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Copy = {
  title: string;
  body: string;
  confirmLabel: string;
  confirmPlaceholder: string;
  button: string;
  deleting: string;
  error: string;
};

type Props = {
  locale: string;
  copy: Copy;
};

export default function DeleteAccountForm({ locale, copy }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDelete = useMemo(() => confirm.trim() === "DELETE", [confirm]);

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;
    const ok = window.confirm(copy.body);
    if (!ok) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json?.detail || json?.error || "delete_failed");
      }

      router.replace(`/${locale}`);
      router.refresh();
    } catch (deleteError) {
      console.error("[DeleteAccountForm] failed", deleteError);
      setError(copy.error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-red-200 bg-red-50/80 p-6 text-red-950 dark:border-red-400/20 dark:bg-red-950/18 dark:text-red-50">
      <h2 className="text-xl font-black">{copy.title}</h2>
      <p className="mt-3 text-sm leading-7 text-red-900/78 dark:text-red-100/76">
        {copy.body}
      </p>

      <label className="mt-5 block text-sm font-bold">
        {copy.confirmLabel}
        <input
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder={copy.confirmPlaceholder}
          className="mt-2 h-11 w-full rounded-2xl border border-red-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-200/70 dark:border-red-300/20 dark:bg-slate-950 dark:text-white dark:focus:ring-red-500/16"
        />
      </label>

      {error ? <p className="mt-3 text-sm font-semibold text-red-700 dark:text-red-200">{error}</p> : null}

      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={!canDelete || isDeleting}
        className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isDeleting ? copy.deleting : copy.button}
      </button>
    </section>
  );
}
