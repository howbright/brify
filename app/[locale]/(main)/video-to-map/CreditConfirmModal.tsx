"use client";

type Props = {
  credits: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function CreditConfirmModal({
  credits,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div
        className="
          relative overflow-hidden
          w-full max-w-md rounded-3xl
          bg-white/98 border border-neutral-200
          shadow-[0_24px_70px_-30px_rgba(15,23,42,0.85)]
          p-5 md:p-6

          /* ✅ 다크모드: 바닥색보다 한 톤 밝은 '카드' 표면 */
          dark:bg-[#0b1220]
          dark:border-white/12
          dark:shadow-[0_24px_90px_-40px_rgba(0,0,0,0.75)]
        "
      >
        {/* subtle highlight layer (다크에서 '시커먼 덩어리' 느낌 완화) */}
        <div className="pointer-events-none absolute inset-0 bg-white/0 dark:bg-white/[0.03]" />

        <h2 className="relative text-base md:text-lg font-semibold text-neutral-900 dark:text-white mb-2.5">
          크레딧 사용
        </h2>
        <p className="relative text-sm md:text-[15px] text-neutral-700 dark:text-white/80 mb-4">
          이번 작업에 <span className="font-semibold">{credits}</span> 크레딧이
          사용됩니다.
        </p>

        <div className="relative flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="
              rounded-2xl px-3 py-1.5 text-xs md:text-sm text-neutral-700
              border border-neutral-300 bg-white
              hover:bg-neutral-100

              dark:text-white/90
              dark:border-white/15
              dark:bg-white/5
              dark:hover:bg-white/10
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
            {credits} 크레딧 사용하고 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
