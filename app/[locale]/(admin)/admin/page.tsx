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
          href={`/${locale}/admin/blog`}
          className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-sm font-semibold text-blue-700">ADMIN BLOG</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-950">
            블로그 글 관리
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            한국어, 영어, 프랑스어 블로그 글을 Markdown으로 작성하고 공개 상태를 관리해요.
          </p>
        </Link>

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
          href={`/${locale}/admin/cc`}
          className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-sm font-semibold text-blue-700">CHALLENGECLIP</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-950">
            앱 결제 권한 관리
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Google Play refund/revoke, voided sync, Pro 권한 조회와 수동 처리를 관리해요.
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
          href={`/${locale}/admin/maps/recent`}
          className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-sm font-semibold text-blue-700">ADMIN RECENT MAPS</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-950">
            최근 생성 구조맵
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            최신 구조맵 50개의 사용자, 상태, 입력 길이, 크레딧, 처리 시간을 빠르게 확인해요.
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/analytics/maps`}
          className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-sm font-semibold text-blue-700">ADMIN MAP ANALYTICS</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-950">
            구조맵 열람 분석
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            사용자가 만든 구조맵을 다시 여는지, 24시간 이후 재방문이 있는지 확인해요.
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

        <Link
          href={`/${locale}/admin/users/maps`}
          className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-sm font-semibold text-blue-700">ADMIN USER MAPS</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-950">
            사용자별 구조맵 조회
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            사용자를 검색하고 그 사용자의 구조맵 목록, 실패 사유, 요약을 한 화면에서 확인해요.
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/users/recent`}
          className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-sm font-semibold text-blue-700">ADMIN RECENT USERS</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-950">
            최근 사용자
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            최근 가입 유저 30명과 최근 로그인 유저 30명을 한 화면에서 확인해요.
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/test-account`}
          className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-sm font-semibold text-rose-700">ADMIN TEST ACCOUNT</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-rose-950">
            테스트계정 초기화
          </h2>
          <p className="mt-2 text-sm leading-6 text-rose-900/70">
            메일 회원가입 테스트를 위해 howbright22@gmail.com 계정을 삭제하고 다시 가입할 수 있게 해요.
          </p>
        </Link>
      </section>
    </main>
  );
}
