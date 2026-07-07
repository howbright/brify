import Link from "next/link";
import { adminSupabase } from "@/utils/supabase/admin";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type ProfilePreview = {
  email: string | null;
  credits_free: number;
  credits_paid: number;
};

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("ko-KR");
}

function statusClassName(status: string) {
  if (status === "done") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function shortId(id: string) {
  return id.slice(0, 8);
}

export default async function AdminRecentMapsPage({ params }: PageProps) {
  const { locale } = await params;

  const { data: maps, error: mapsError } = await adminSupabase
    .from("maps")
    .select(
      "id,user_id,title,short_title,map_status,extract_status,source_type,source_char_count,credits_charged,required_credits,output_language,ai_processing_ms,share_enabled,created_at,updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (mapsError) {
    throw new Error(`recent maps load failed: ${mapsError.message}`);
  }

  const userIds = Array.from(new Set((maps ?? []).map((map) => map.user_id)));
  const { data: profiles, error: profilesError } = userIds.length
    ? await adminSupabase
        .from("profiles")
        .select("id,email,credits_free,credits_paid")
        .in("id", userIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(`recent map profiles load failed: ${profilesError.message}`);
  }

  const profileById = new Map<string, ProfilePreview>(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        email: profile.email,
        credits_free: profile.credits_free,
        credits_paid: profile.credits_paid,
      },
    ])
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/${locale}/admin`} className="text-sm font-semibold text-blue-700">
            ← 어드민 홈
          </Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
            최근 생성 구조맵
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            최신 생성 순으로 50개의 구조맵을 보여줍니다. 사용자, 상태, 사용 크레딧, 처리 시간을 빠르게 확인할 수 있어요.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
          총 {formatNumber(maps?.length ?? 0)}개 표시
        </div>
      </div>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">생성일</th>
                <th className="px-4 py-3">구조맵</th>
                <th className="px-4 py-3">사용자</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">입력</th>
                <th className="px-4 py-3">크레딧</th>
                <th className="px-4 py-3">처리</th>
                <th className="px-4 py-3">공유</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(maps ?? []).map((map) => {
                const profile = profileById.get(map.user_id);
                const title = map.short_title || map.title || "(제목 없음)";

                return (
                  <tr key={map.id} className="align-top hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-500">
                      {formatDateTime(map.created_at)}
                    </td>
                    <td className="min-w-[260px] px-4 py-4">
                      <Link
                        href={`/${locale}/admin/${map.id}`}
                        className="font-black text-slate-950 hover:text-blue-700"
                      >
                        {title}
                      </Link>
                      <div className="mt-1 text-xs text-slate-400">id: {shortId(map.id)}</div>
                      {map.output_language ? (
                        <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                          {map.output_language}
                        </div>
                      ) : null}
                    </td>
                    <td className="min-w-[220px] px-4 py-4">
                      <div className="font-semibold text-slate-800">
                        {profile?.email ?? "(email 없음)"}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">user: {shortId(map.user_id)}</div>
                      {profile ? (
                        <div className="mt-1 text-xs text-slate-500">
                          free {formatNumber(profile.credits_free)} · paid{" "}
                          {formatNumber(profile.credits_paid)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${statusClassName(
                          map.map_status
                        )}`}
                      >
                        {map.map_status}
                      </span>
                      <div className="mt-2 text-xs text-slate-500">extract: {map.extract_status}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                      <div>{map.source_type}</div>
                      <div className="mt-1 text-slate-400">
                        {formatNumber(map.source_char_count)}자
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                      <div>charged {formatNumber(map.credits_charged)}</div>
                      <div className="mt-1 text-slate-400">
                        required {formatNumber(map.required_credits)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                      {map.ai_processing_ms ? `${formatNumber(map.ai_processing_ms)}ms` : "-"}
                      <div className="mt-1 text-slate-400">
                        updated {formatDateTime(map.updated_at)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-600">
                      {map.share_enabled ? "ON" : "OFF"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(maps ?? []).length === 0 ? (
          <div className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
            아직 생성된 구조맵이 없습니다.
          </div>
        ) : null}
      </section>
    </main>
  );
}
