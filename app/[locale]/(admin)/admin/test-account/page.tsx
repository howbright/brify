import Link from "next/link";
import ResetTestAccountButton from "./ResetTestAccountButton";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminTestAccountPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link href={`/${locale}/admin`} className="text-sm font-semibold text-blue-700">
        ← 어드민 홈
      </Link>

      <h1 className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
        테스트계정 초기화
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
        메일 회원가입 테스트용 계정을 삭제해서 같은 이메일로 다시 가입 테스트를 할 수 있게 합니다.
        현재는 안전을 위해 고정된 테스트 이메일만 초기화합니다.
      </p>

      <section className="mt-8">
        <ResetTestAccountButton />
      </section>
    </main>
  );
}
