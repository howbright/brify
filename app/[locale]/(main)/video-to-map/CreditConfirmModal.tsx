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
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/50 backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
      aria-label="크레딧 사용 확인"
      onMouseDown={(e) => {
        // 바깥 클릭은 '취소'와 동일하게 처리
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="
          relative overflow-hidden
          w-full max-w-md rounded-3xl
          bg-white border border-slate-400
          shadow-[0_28px_90px_-40px_rgba(15,23,42,0.85)]
          p-5 md:p-6

          /* ✅ dark: 배경보다 한 톤 밝게 + ring으로 경계 확실히 */
          dark:bg-[#0F172A]
          dark:border-white/20
          dark:ring-1 dark:ring-white/16
          dark:shadow-[0_34px_120px_-60px_rgba(0,0,0,0.95)]
        "
      >
        {/* ✅ 상단 하이라이트 + 가장자리 그라데이션(카드 표면감) */}
        <div
          className="
            pointer-events-none absolute inset-0
            bg-[radial-gradient(800px_260px_at_20%_0%,rgba(59,130,246,0.18),transparent_55%)]
            dark:bg-[radial-gradient(800px_260px_at_20%_0%,rgba(56,189,248,0.18),transparent_55%)]
          "
        />
        <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />

        {/* ✅ 아주 얇은 하단 경계(카드가 떠 보이게) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-400 dark:bg-white/20" />

        <h2 className="relative text-base md:text-lg font-semibold text-neutral-900 dark:text-white mb-2.5">
          크레딧 사용
        </h2>

        <p className="relative text-sm md:text-[15px] text-neutral-700 dark:text-white/80 mb-2">
          이번 작업에 <span className="font-semibold">{credits}</span> 크레딧이
          사용됩니다.
        </p>

        {/* ✅ 핵심 고지: 시작 후 취소 불가 */}
        <div
          className="
            relative mb-4
            rounded-2xl border border-amber-300 bg-amber-50
            px-3 py-2.5 text-[12px] md:text-[13px] text-amber-900/90
            dark:border-amber-300/25 dark:bg-amber-500/10 dark:text-amber-100/90
          "
          role="note"
        >
          이 작업은 <span className="font-semibold">시작 후 취소할 수 없습니다.</span>{" "}
          크레딧은 즉시 차감되며, 생성이 완료되면 결과가 저장됩니다.
        </div>

        <div className="relative flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="
              rounded-2xl px-3 py-1.5 text-xs md:text-sm text-neutral-700
              border border-slate-400 bg-white
              hover:bg-neutral-100

              dark:text-white/90
              dark:border-white/20
              dark:bg-white/[0.08]
              dark:hover:bg-white/[0.12]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25
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
              dark:bg-[rgb(var(--hero-b))] dark:text-neutral-950
              dark:hover:bg-[rgb(var(--hero-a))]
              shadow-sm hover:shadow-md
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--hero-b))]/35
            "
          >
            {credits} 크레딧 사용하고 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
