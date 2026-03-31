import { useLocale } from "next-intl";

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-300/90 bg-white/92 p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.28)] backdrop-blur sm:p-6 dark:border-white/12 dark:bg-white/[0.04] dark:shadow-[0_28px_80px_-56px_rgba(0,0,0,0.7)]">
      <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-2.5 text-[15px] leading-7 text-slate-700 dark:text-white/82">
        {children}
      </div>
    </section>
  );
}

function KeyFact({
  title,
  value,
  tone = "blue",
}: {
  title: string;
  value: string;
  tone?: "blue" | "amber" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200/80 bg-amber-50/90 text-amber-900 dark:border-amber-300/15 dark:bg-amber-400/10 dark:text-amber-50"
      : tone === "emerald"
        ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-900 dark:border-emerald-300/15 dark:bg-emerald-400/10 dark:text-emerald-50"
        : "border-blue-200/80 bg-blue-50/90 text-blue-900 dark:border-blue-300/15 dark:bg-blue-400/10 dark:text-blue-50";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <div className="text-[12px] font-semibold uppercase tracking-[0.14em] opacity-75">
        {title}
      </div>
      <div className="mt-1 text-[17px] font-black tracking-[-0.02em]">
        {value}
      </div>
    </div>
  );
}

export default function RefundPolicyPage() {
  const locale = useLocale();
  const isKorean = locale === "ko";

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_38%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.9))] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(11,18,32,0.98))]" />

      <div className="relative mx-auto flex max-w-4xl flex-col gap-6 px-4 pb-14 pt-28 md:pt-32">
        <section className="overflow-hidden rounded-[32px] border border-slate-300/90 bg-white/92 p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.3)] backdrop-blur sm:p-8 dark:border-white/12 dark:bg-white/[0.04] dark:shadow-[0_32px_100px_-62px_rgba(0,0,0,0.82)]">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[12px] font-semibold tracking-[0.12em] text-blue-700 dark:border-blue-300/15 dark:bg-blue-400/10 dark:text-blue-100">
            {isKorean ? "BRIFY REFUND POLICY" : "BRIFY REFUND POLICY"}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-[38px] dark:text-white">
            {isKorean ? "환불 정책" : "Refund Policy"}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-[16px] dark:text-white/68">
            {isKorean
              ? "Brify 유료 크레딧의 사용기간, 환불 가능 기준, 환불 제한 사유를 안내합니다. 결제 전 아래 기준을 확인해 주세요."
              : "This page explains the validity period, refund eligibility, and refund limitations for Brify paid credits. Please review the rules below before purchasing."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <KeyFact
              title={isKorean ? "사용 가능 기간" : "Validity"}
              value={isKorean ? "결제일로부터 1년" : "1 year from payment"}
            />
            <KeyFact
              title={isKorean ? "단순 변심 환불" : "Change-of-mind Refund"}
              value={isKorean ? "7일 이내, 미사용 시" : "Within 7 days if unused"}
              tone="amber"
            />
            <KeyFact
              title={isKorean ? "환불 방식" : "Refund Method"}
              value={isKorean ? "원 결제수단 환불" : "Original payment method"}
              tone="emerald"
            />
          </div>
        </section>

        <PolicySection title={isKorean ? "1. 적용 대상" : "1. Scope"}>
          <p>
            {isKorean
              ? "본 환불 정책은 Brify에서 판매하는 유료 크레딧 상품에 적용됩니다."
              : "This refund policy applies to paid credit products sold by Brify."}
          </p>
        </PolicySection>

        <PolicySection title={isKorean ? "2. 이용기간" : "2. Validity Period"}>
          <p>
            {isKorean
              ? "유료 크레딧의 이용기간은 각 결제일로부터 1년입니다."
              : "Paid credits are valid for 1 year from each payment date."}
          </p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {isKorean
              ? "위 기간은 유료 크레딧의 사용 가능 기간을 의미합니다. 환불 가능 여부와 환불 범위는 아래 기준 및 관련 법령에 따라 별도로 판단됩니다."
              : "This period refers to the validity period for using paid credits. Refund eligibility and refund scope are determined separately under the rules below and applicable law."}
          </p>
        </PolicySection>

        <PolicySection title={isKorean ? "3. 환불 가능 기준" : "3. Eligibility"}>
          <p>
            {isKorean
              ? "유료 크레딧은 구매 후 7일 이내이고, 해당 주문으로 충전된 크레딧을 전혀 사용하지 않은 경우 전액 환불이 가능합니다."
              : "Paid credits are eligible for a full refund within 7 days of purchase if none of the credits charged by that order have been used."}
          </p>
          <p>
            {isKorean
              ? "미사용 유료 크레딧에 대한 환불은 구매 시점에 결제된 금액을 기준으로 처리됩니다."
              : "Refunds for unused paid credits are processed based on the amount paid at the time of purchase."}
          </p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {isKorean
              ? "환불은 원칙적으로 결제에 사용한 동일한 결제수단으로 진행됩니다."
              : "Refunds are in principle made through the same payment method originally used for the purchase."}
          </p>
        </PolicySection>

        <PolicySection title={isKorean ? "4. 환불 제한" : "4. Limitations"}>
          <p>
            {isKorean
              ? "이미 사용한 유료 크레딧은 취소 또는 환불이 불가합니다."
              : "Used paid credits cannot be canceled or refunded."}
          </p>
          <p>
            {isKorean
              ? "크레딧 사용이 시작되었거나 맵 생성이 진행된 이후에는 해당 주문에 대한 단순 변심 환불이 제한됩니다."
              : "Once credit usage has started or map generation has begun, change-of-mind refunds for that order are restricted."}
          </p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {isKorean
              ? "구매 후 7일이 지난 미사용 유료 크레딧은 단순 변심에 의한 환불 대상이 아니며, 결제일로부터 1년의 유효기간 내에서만 사용할 수 있습니다."
              : "Unused paid credits remaining after 7 days from purchase are not eligible for refunds due to a change of mind, and may only be used within the 1-year validity period from the payment date."}
          </p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {isKorean
              ? "구매한 유료 크레딧은 회원 간 양도, 대여 또는 이전이 불가합니다."
              : "Purchased paid credits may not be transferred, assigned, or lent to another member."}
          </p>
        </PolicySection>

        <PolicySection title={isKorean ? "5. 예외 환불" : "5. Exception Cases"}>
          <p>
            {isKorean
              ? "중복 결제, 시스템 오류, 관계 법령상 환불이 필요한 경우에는 별도 검토 후 환불될 수 있습니다."
              : "Duplicate charges, system errors, or cases where a refund is required by applicable law may be reviewed separately for a refund."}
          </p>
        </PolicySection>

        <PolicySection title={isKorean ? "6. 환불 요청 방법" : "6. How to Request a Refund"}>
          <p>
            {isKorean
              ? "환불 검토가 필요하시면 결제일, 계정 이메일, 결제 내역을 함께 적어 hello@brify.app으로 이메일을 보내 주세요."
              : "If you need a refund review, please email hello@brify.app with your purchase date, account email, and payment details."}
          </p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {isKorean
              ? "원활한 확인을 위해 주문번호, 결제 금액, 결제 수단, 환불 사유를 함께 보내 주시면 검토가 더 빠르게 진행됩니다."
              : "To speed up the review, please also include your order ID, payment amount, payment method, and reason for the refund request."}
          </p>
        </PolicySection>

        <PolicySection title={isKorean ? "7. 환불 처리 안내" : "7. Refund Processing"}>
          <p>
            {isKorean
              ? "환불 승인 후 실제 결제 취소 및 환불 반영 시점은 카드사, 은행, 결제대행사 정책에 따라 달라질 수 있으며, 영업일 기준 수일이 소요될 수 있습니다."
              : "After a refund is approved, the actual cancellation and refund posting time may vary depending on your card issuer, bank, or payment provider, and it may take several business days."}
          </p>
        </PolicySection>

        <PolicySection title={isKorean ? "8. 문의처" : "8. Contact"}>
          <p className="font-semibold text-slate-900 dark:text-white">
            hello@brify.app
          </p>
          <p className="text-sm text-slate-500 dark:text-white/58">
            {isKorean
              ? "환불 정책의 해석 및 적용은 관련 법령, 결제대행사 기준, 개별 결제 상태에 따라 달라질 수 있습니다."
              : "The interpretation and application of this refund policy may vary depending on applicable law, payment provider standards, and the status of the individual transaction."}
          </p>
        </PolicySection>
      </div>
    </div>
  );
}
