import Link from "next/link";

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="mx-auto max-w-4xl px-6 py-24">
      <h1 className="text-3xl font-black tracking-tight text-neutral-950">어드민 페이지</h1>
      <p className="mt-3 text-neutral-600">
        관리자 가드가 정상 동작 중이에요. 환불 처리 화면으로 바로 이동할 수 있어요.
      </p>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <Link
          href={`/${locale}/admin/refund`}
          className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-sm font-semibold text-blue-700">ADMIN REFUND</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-950">
            환불 결제 목록
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            이메일, 결제일, 상태, 결제사로 검색하고 환불 가능 여부를 빠르게 확인해요.
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/ops/maps`}
          className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-sm font-semibold text-blue-700">ADMIN MAP OPS</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-950">
            구조맵 운영 현황
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            큐 backlog, 최근 처리시간, 실패율, 실패 맵 목록을 한 화면에서 확인해요.
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/credits/gift`}
          className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-sm font-semibold text-blue-700">ADMIN GIFT</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-950">
            무료 크레딧 선물 지급
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            특정 사용자에게 free credits를 지급하고 트랜잭션과 알림까지 함께 기록해요.
          </p>
        </Link>
      </section>
    </main>
  );
}
