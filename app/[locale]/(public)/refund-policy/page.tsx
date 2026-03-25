import { useLocale } from "next-intl";

export default function RefundPolicyPage() {
  const locale = useLocale();
  const isKorean = locale === "ko";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-bold">
        {isKorean ? "환불 정책" : "Refund Policy"}
      </h1>

      <p>
        {isKorean
          ? "Brify의 유료 크레딧 및 결제 상품 환불 기준을 안내합니다."
          : "This page explains the refund standards for Brify paid credits and purchases."}
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "1. 기본 원칙" : "1. Basic Policy"}
        </h2>
        <p>
          {isKorean
            ? "디지털 상품의 특성상, 크레딧이 이미 사용되었거나 구조맵 생성 작업이 시작된 이후에는 원칙적으로 환불이 어렵습니다."
            : "Due to the nature of digital goods, refunds are generally unavailable once credits have been used or map generation has started."}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "2. 환불이 가능한 경우" : "2. When a Refund May Be Available"}
        </h2>
        <p>
          {isKorean
            ? "다음과 같은 경우에는 개별 확인 후 환불이 가능합니다: 중복 결제, 시스템 오류로 서비스 제공이 불가능했던 경우, 관계 법령상 환불이 필요한 경우."
            : "Refunds may be reviewed case by case for duplicate charges, service failures caused by system errors, or where required by applicable law."}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "3. 환불 요청 방법" : "3. How to Request a Refund"}
        </h2>
        <p>
          {isKorean
            ? "환불이 필요하시면 결제일, 계정 이메일, 결제 내역을 함께 적어 고객지원으로 문의해 주세요."
            : "If you need a refund review, please contact support with your purchase date, account email, and payment details."}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          {isKorean ? "4. 문의처" : "4. Contact"}
        </h2>
        <p>hello@brify.ai</p>
      </section>
    </div>
  );
}
