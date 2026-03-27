import { useLocale } from "next-intl";

export default function RefundPolicyPage() {
  const locale = useLocale();
  const isKorean = locale === "ko";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-10 pt-28 md:pt-32">
      <h1 className="text-2xl font-bold">
        {isKorean ? "환불 정책" : "Refund Policy"}
      </h1>

      <p>
        {isKorean
          ? "Brify 유료 크레딧의 환불 기준을 안내합니다."
          : "This page explains the refund policy for Brify paid credits."}
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "1. 적용 대상" : "1. Scope"}
        </h2>
        <p>
          {isKorean
            ? "본 환불 정책은 Brify에서 판매하는 유료 크레딧 상품에 적용됩니다."
            : "This refund policy applies to paid credit products sold by Brify."}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "2. 이용기간" : "2. Validity Period"}
        </h2>
        <p>
          {isKorean
            ? "유료 크레딧의 이용기간은 결제일로부터 1년입니다."
            : "Paid credits are valid for 1 year from the payment date."}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "3. 환불 가능 기준" : "3. Eligibility"}
        </h2>
        <p>
          {isKorean
            ? "크레딧은 구매 후 7일 이내, 해당 주문으로 충전된 크레딧을 사용하지 않은 경우 전액 환불 가능합니다."
            : "Credits are eligible for a full refund within 7 days of purchase if none of the credits charged by that order have been used."}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "4. 환불 제한" : "4. Limitations"}
        </h2>
        <p>
          {isKorean
            ? "크레딧 사용 또는 맵 생성이 시작된 이후에는 환불이 제한됩니다."
            : "Refunds are limited once credits have been used or map generation has started."}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "5. 예외 환불" : "5. Exception Cases"}
        </h2>
        <p>
          {isKorean
            ? "다만 중복 결제, 시스템 오류, 관계 법령상 필요한 경우에는 별도 검토 후 환불될 수 있습니다."
            : "However, duplicate charges, system errors, or cases where a refund is required by applicable law may be reviewed separately for a refund."}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "6. 환불 요청 방법" : "6. How to Request a Refund"}
        </h2>
        <p>
          {isKorean
            ? "환불이 필요하시면 결제일, 계정 이메일, 결제 내역을 함께 적어 hello@brify.app 으로 이메일을 보내 주세요."
            : "If you need a refund review, please email hello@brify.app with your purchase date, account email, and payment details."}
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {isKorean
            ? "원활한 확인을 위해 주문번호, 결제 금액, 결제 수단, 환불 사유를 함께 보내 주시면 검토가 더 빠르게 진행됩니다."
            : "To speed up the review, please also include your order ID, payment amount, payment method, and reason for the refund request."}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "7. 환불 처리 안내" : "7. Refund Processing"}
        </h2>
        <p>
          {isKorean
            ? "환불 승인 후 실제 결제 취소 및 환불 반영 시점은 카드사, 은행, 결제대행사 정책에 따라 달라질 수 있으며, 영업일 기준 수일이 소요될 수 있습니다."
            : "After a refund is approved, the actual cancellation and refund posting time may vary depending on your card issuer, bank, or payment provider, and it may take several business days."}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "8. 문의처" : "8. Contact"}
        </h2>
        <p>hello@brify.app</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {isKorean
            ? "환불 정책의 해석 및 적용은 관련 법령, 결제대행사 기준, 개별 결제 상태에 따라 달라질 수 있습니다."
            : "The interpretation and application of this refund policy may vary depending on applicable law, payment provider standards, and the status of the individual transaction."}
        </p>
      </section>
    </div>
  );
}
