import Link from "next/link";
import { adminSupabase } from "@/utils/supabase/admin";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type ProfileRow = {
  id: string;
  email: string | null;
  created_at: string | null;
  credits_free: number;
  credits_paid: number;
  locale: string | null;
  role: string;
};

type AuthUserPreview = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string | null;
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
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("ko-KR");
}

function shortId(id: string) {
  return id.slice(0, 8);
}

function dateMillis(value: string | null | undefined) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

async function loadAuthUsers() {
  const users: AuthUserPreview[] = [];
  const perPage = 1000;
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`auth users load failed: ${error.message}`);
    }

    const pageUsers = data.users ?? [];
    users.push(
      ...pageUsers.map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      }))
    );

    if (pageUsers.length < perPage) break;
  }

  return users;
}

function UserTable({
  title,
  description,
  users,
  profileById,
  mode,
}: {
  title: string;
  description: string;
  users: AuthUserPreview[];
  profileById: Map<string, ProfileRow>;
  mode: "signup" | "login";
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">{mode === "signup" ? "가입일" : "최근 로그인"}</th>
              <th className="px-4 py-3">사용자</th>
              <th className="px-4 py-3">프로필</th>
              <th className="px-4 py-3">크레딧</th>
              <th className="px-4 py-3">Auth 생성일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const profile = profileById.get(user.id);
              const primaryDate =
                mode === "signup" ? profile?.created_at ?? user.created_at : user.last_sign_in_at;

              return (
                <tr key={`${mode}-${user.id}`} className="align-top hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-500">
                    {formatDateTime(primaryDate)}
                  </td>
                  <td className="min-w-[260px] px-4 py-4">
                    <div className="font-black text-slate-950">
                      {profile?.email || user.email || "(email 없음)"}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">id: {shortId(user.id)}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                    <div>role: {profile?.role ?? "-"}</div>
                    <div className="mt-1 text-slate-400">locale: {profile?.locale ?? "-"}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                    <div>free {formatNumber(profile?.credits_free)}</div>
                    <div className="mt-1 text-slate-400">paid {formatNumber(profile?.credits_paid)}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-500">
                    {formatDateTime(user.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 ? (
        <div className="px-6 py-14 text-center text-sm font-semibold text-slate-500">
          표시할 사용자가 없습니다.
        </div>
      ) : null}
    </section>
  );
}

export default async function AdminRecentUsersPage({ params }: PageProps) {
  const { locale } = await params;

  const [{ data: recentProfiles, error: profilesError }, authUsers] = await Promise.all([
    adminSupabase
      .from("profiles")
      .select("id,email,created_at,credits_free,credits_paid,locale,role")
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(30),
    loadAuthUsers(),
  ]);

  if (profilesError) {
    throw new Error(`recent profiles load failed: ${profilesError.message}`);
  }

  const loginUsers = authUsers
    .filter((user) => Boolean(user.last_sign_in_at))
    .sort((a, b) => dateMillis(b.last_sign_in_at) - dateMillis(a.last_sign_in_at))
    .slice(0, 30);
  const profileIds = new Set<string>([
    ...(recentProfiles ?? []).map((profile) => profile.id),
    ...loginUsers.map((user) => user.id),
  ]);
  const missingProfileIds = Array.from(profileIds).filter(
    (id) => !(recentProfiles ?? []).some((profile) => profile.id === id)
  );
  const { data: extraProfiles, error: extraProfilesError } = missingProfileIds.length
    ? await adminSupabase
        .from("profiles")
        .select("id,email,created_at,credits_free,credits_paid,locale,role")
        .in("id", missingProfileIds)
    : { data: [], error: null };

  if (extraProfilesError) {
    throw new Error(`recent login profiles load failed: ${extraProfilesError.message}`);
  }

  const allProfiles = [...(recentProfiles ?? []), ...(extraProfiles ?? [])];
  const profileById = new Map<string, ProfileRow>(
    allProfiles.map((profile) => [profile.id, profile])
  );
  const authById = new Map(authUsers.map((user) => [user.id, user]));
  const signupUsers = (recentProfiles ?? []).map((profile) => {
    const authUser = authById.get(profile.id);
    return {
      id: profile.id,
      email: profile.email ?? authUser?.email,
      created_at: authUser?.created_at ?? profile.created_at ?? undefined,
      last_sign_in_at: authUser?.last_sign_in_at,
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/${locale}/admin`} className="text-sm font-semibold text-blue-700">
            ← 어드민 홈
          </Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
            최근 사용자
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
            최근 회원가입 사용자 30명과 최근 로그인 사용자 30명을 함께 확인합니다. 가입일은 profiles 기준이고, 최근 로그인은 Supabase Auth의 last_sign_in_at 기준입니다.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
          Auth 조회 {formatNumber(authUsers.length)}명
        </div>
      </div>

      <div className="mt-8 grid gap-8">
        <UserTable
          title="최근 회원가입 유저 30명"
          description="profiles.created_at 기준으로 가장 최근 생성된 사용자입니다."
          users={signupUsers}
          profileById={profileById}
          mode="signup"
        />

        <UserTable
          title="최근 로그인 유저 30명"
          description="Supabase Auth last_sign_in_at 기준입니다. Auth API 조회 범위 안에서 정렬합니다."
          users={loginUsers}
          profileById={profileById}
          mode="login"
        />
      </div>
    </main>
  );
}
