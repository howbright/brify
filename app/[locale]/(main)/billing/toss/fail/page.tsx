type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    code?: string;
    message?: string;
  }>;
};

export default async function BillingTossFailPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const query = await searchParams;
  const isKorean = locale === "ko";

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-slate-300 bg-white p-6 shadow-sm dark:border-white/12 dark:bg-slate-950">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isKorean ? "결제가 완료되지 않았어요." : "Payment did not complete."}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {isKorean
            ? "에러 코드를 확인한 뒤 다시 시도해주세요."
            : "Please check the error code and try again."}
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          <p>code: {query.code ?? "-"}</p>
          <p>message: {query.message ?? "-"}</p>
        </div>
      </div>
    </div>
  );
}
