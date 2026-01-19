"use client";

type Props = {
  credits: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function CreditConfirmModal({ credits, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
      <div
        className="
          w-full max-w-md rounded-3xl
          bg-white/98 border border-neutral-200
          shadow-[0_24px_70px_-30px_rgba(15,23,42,0.85)]
          p-5 md:p-6
          dark:bg-[#020617]/98 dark:border-white/12
        "
      >
        <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white mb-2.5">
          크레딧 사용
        </h2>
        <p className="text-sm md:text-[15px] text-neutral-700 dark:text-neutral-200 mb-4">
          이번 작업에 <span className="font-semibold">{credits}</span> 크레딧이 사용돼.
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="
              rounded-2xl px-3 py-1.5 text-xs md:text-sm text-neutral-700
              border border-neutral-300 bg-white
              hover:bg-neutral-100
              dark:text-neutral-100 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10
            "
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="
              rounded-2xl px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white
              bg-blue-600 hover:bg-blue-700
              dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
              shadow-sm hover:shadow-md
            "
          >
            {credits} 크레딧 사용하고 시작
          </button>
        </div>
      </div>
    </div>
  );
}
