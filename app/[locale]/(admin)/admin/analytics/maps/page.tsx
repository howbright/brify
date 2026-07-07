import Link from "next/link";
import { adminSupabase } from "@/utils/supabase/admin";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type EventRow = {
  id: string;
  map_id: string;
  user_id: string | null;
  access_mode: "owner" | "shared" | "admin";
  opened_at: string;
  session_key: string | null;
};

type MapPreview = {
  id: string;
  user_id: string;
  title: string;
  short_title: string | null;
  created_at: string;
  map_status: string;
};

type ProfilePreview = {
  id: string;
  email: string | null;
};

type MapAggregate = {
  mapId: string;
  total: number;
  uniqueSessions: Set<string>;
  lastOpenedAt: string;
  after24h: number;
  owner: number;
  shared: number;
  admin: number;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
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

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function shortId(id: string) {
  return id.slice(0, 8);
}

function eventIdentity(event: EventRow) {
  return event.user_id || event.session_key || event.id;
}

function addDays(date: string, days: number) {
  return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
}

function getModeCount(aggregate: MapAggregate, mode: EventRow["access_mode"]) {
  if (mode === "owner") return aggregate.owner;
  if (mode === "shared") return aggregate.shared;
  return aggregate.admin;
}

export default async function AdminMapAnalyticsPage({ params }: PageProps) {
  const { locale } = await params;
  const now = Date.now();
  const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: eventsData, error: eventsError } = await adminSupabase
    .from("map_open_events")
    .select("id,map_id,user_id,access_mode,opened_at,session_key")
    .gte("opened_at", since30)
    .order("opened_at", { ascending: false })
    .limit(5000);

  if (eventsError) {
    throw new Error(`map open events load failed: ${eventsError.message}`);
  }

  const events = (eventsData ?? []) as EventRow[];
  const mapIds = Array.from(new Set(events.map((event) => event.map_id)));
  const { data: mapsData, error: mapsError } = mapIds.length
    ? await adminSupabase
        .from("maps")
        .select("id,user_id,title,short_title,created_at,map_status")
        .in("id", mapIds)
    : { data: [], error: null };

  if (mapsError) {
    throw new Error(`map analytics maps load failed: ${mapsError.message}`);
  }

  const maps = (mapsData ?? []) as MapPreview[];
  const userIds = Array.from(new Set(maps.map((map) => map.user_id)));
  const { data: profilesData, error: profilesError } = userIds.length
    ? await adminSupabase
        .from("profiles")
        .select("id,email")
        .in("id", userIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(`map analytics profiles load failed: ${profilesError.message}`);
  }

  const mapById = new Map<string, MapPreview>(maps.map((map) => [map.id, map]));
  const profileById = new Map<string, ProfilePreview>(
    ((profilesData ?? []) as ProfilePreview[]).map((profile) => [profile.id, profile])
  );
  const aggregateByMap = new Map<string, MapAggregate>();

  for (const event of events) {
    const aggregate =
      aggregateByMap.get(event.map_id) ??
      ({
        mapId: event.map_id,
        total: 0,
        uniqueSessions: new Set<string>(),
        lastOpenedAt: event.opened_at,
        after24h: 0,
        owner: 0,
        shared: 0,
        admin: 0,
      } satisfies MapAggregate);
    const map = mapById.get(event.map_id);

    aggregate.total += 1;
    aggregate.uniqueSessions.add(eventIdentity(event));
    if (new Date(event.opened_at).getTime() > new Date(aggregate.lastOpenedAt).getTime()) {
      aggregate.lastOpenedAt = event.opened_at;
    }
    if (event.access_mode === "owner") aggregate.owner += 1;
    if (event.access_mode === "shared") aggregate.shared += 1;
    if (event.access_mode === "admin") aggregate.admin += 1;

    if (map && new Date(event.opened_at) >= addDays(map.created_at, 1)) {
      aggregate.after24h += 1;
    }

    aggregateByMap.set(event.map_id, aggregate);
  }

  const aggregates = Array.from(aggregateByMap.values()).sort(
    (a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
  );
  const sevenDayEvents = events.filter((event) => event.opened_at >= since7);
  const revisitedMaps = aggregates.filter((aggregate) => aggregate.total >= 2).length;
  const mapsAfter24h = aggregates.filter((aggregate) => aggregate.after24h > 0).length;
  const mapsThreePlus = aggregates.filter((aggregate) => aggregate.total >= 3).length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <Link href={`/${locale}/admin`} className="text-sm font-semibold text-blue-700">
        ← 어드민 홈
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-950">
            구조맵 열람 분석
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
            최근 30일 동안 사용자가 구조맵을 다시 여는지 확인합니다. 10분 이내 같은 사용자/세션의 중복 열람은 API에서 한 번으로 정리됩니다.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
          최근 30일 이벤트 최대 5,000개 기준
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["최근 7일 열람", sevenDayEvents.length],
          ["최근 30일 열람", events.length],
          ["재방문 맵", revisitedMaps],
          ["24시간 이후 재열람", mapsAfter24h],
          ["3회 이상 열린 맵", mapsThreePlus],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-black uppercase tracking-wide text-slate-400">
              {label}
            </div>
            <div className="mt-3 text-3xl font-black text-slate-950">
              {formatNumber(Number(value))}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-black text-slate-950">구조맵별 열람</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            최근 열람 순서입니다. owner/shared는 분리해서 볼 수 있게 표시합니다.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">마지막 열람</th>
                <th className="px-4 py-3">구조맵</th>
                <th className="px-4 py-3">생성자</th>
                <th className="px-4 py-3">총 열람</th>
                <th className="px-4 py-3">고유 세션</th>
                <th className="px-4 py-3">24h 이후</th>
                <th className="px-4 py-3">모드</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aggregates.map((aggregate) => {
                const map = mapById.get(aggregate.mapId);
                const profile = map ? profileById.get(map.user_id) : null;
                const title = map?.short_title || map?.title || "(삭제된 구조맵)";

                return (
                  <tr key={aggregate.mapId} className="align-top hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-500">
                      {formatDateTime(aggregate.lastOpenedAt)}
                    </td>
                    <td className="min-w-[280px] px-4 py-4">
                      {map ? (
                        <Link
                          href={`/${locale}/admin/${map.id}`}
                          className="font-black text-slate-950 hover:text-blue-700"
                        >
                          {title}
                        </Link>
                      ) : (
                        <div className="font-black text-slate-500">{title}</div>
                      )}
                      <div className="mt-1 text-xs text-slate-400">
                        id: {shortId(aggregate.mapId)}
                      </div>
                      {map ? (
                        <div className="mt-1 text-xs text-slate-500">
                          생성 {formatDateTime(map.created_at)} · {map.map_status}
                        </div>
                      ) : null}
                    </td>
                    <td className="min-w-[220px] px-4 py-4 text-xs font-semibold text-slate-600">
                      <div>{profile?.email ?? "(email 없음)"}</div>
                      {map ? (
                        <div className="mt-1 text-slate-400">user: {shortId(map.user_id)}</div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-black text-slate-950">
                      {formatNumber(aggregate.total)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-700">
                      {formatNumber(aggregate.uniqueSessions.size)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-700">
                      {formatNumber(aggregate.after24h)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                      {(["owner", "shared", "admin"] as const).map((mode) => (
                        <div key={mode}>
                          {mode}: {formatNumber(getModeCount(aggregate, mode))}
                        </div>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {aggregates.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
            아직 열람 이벤트가 없습니다.
          </div>
        ) : null}
      </section>
    </main>
  );
}
