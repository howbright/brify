// app/[locale]/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

// Helpers
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d as string;
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center px-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">
            Please sign in
          </h1>
          <p className="mt-2 text-[color-mix(in_oklab,var(--color-foreground),transparent_20%)]">
            You need an account to view your dashboard.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              href="/login"
              className="rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] px-4 py-2 text-sm text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-sm"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-muted)]"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Profile: credits & (optional) plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, email")
    .eq("id", user.id)
    .single();

  // 잔액 상태(선택)
  function creditBadge(credits: number) {
    if (credits <= 10) return { label: "Low balance", tone: "warning" };
    if (credits >= 100) return { label: "Healthy", tone: "ok" };
    return { label: "Pay-as-you-go", tone: "neutral" };
  }

  // Recent summaries (last 6)

  const { data: summaries } = await supabase
    .from("summaries")
    .select("id, title, source_type, created_at, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const credits = profile?.credits ?? 0;
  const badge = creditBadge(credits);

  return (
    <div className="min-h-[100dvh] bg-[var(--color-background-soft)]">
      <header className="mx-auto max-w-5xl px-4 pt-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">
              Dashboard
            </h1>
            <p className="mt-1 text-[color-mix(in_oklab,var(--color-foreground),transparent_35%)]">
              Welcome back{profile?.email ? `, ${profile.email}` : ""} 👋
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/summarize"
              className="rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] px-4 py-2 text-sm text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-sm"
            >
              ✨ Start new summary
            </Link>
            <Link
              href="/billing"
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-muted)]"
            >
              💳 Billing
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        {/* Top cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          {/* Credits card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-[var(--color-text)]">
                Credits
              </h2>
              <span
                className="rounded-full border px-2 py-0.5 text-xs"
                style={{
                  borderColor:
                    badge.tone === "warning"
                      ? "color-mix(in_srgb,#f59e0b,transparent 70%)"
                      : "color-mix(in_srgb,var(--color-primary-500),transparent 70%)",
                  background:
                    badge.tone === "warning"
                      ? "color-mix(in_srgb,#f59e0b,white 85%)"
                      : "color-mix(in_srgb,var(--color-primary-500),white 85%)",
                  color:
                    badge.tone === "warning"
                      ? "#b45309"
                      : "var(--color-primary-700)",
                }}
              >
                {badge.label}
              </span>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-primary-600)]">
              {credits.toLocaleString()}{" "}
              <span className="text-base font-medium text-[color-mix(in_oklab,var(--color-foreground),transparent_40%)]">
                left
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              1 summary ≈ 1 credit (very long inputs may cost more)
            </p>
            <Link
              href="/billing"
              className="mt-4 inline-block rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] px-4 py-2 text-sm text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-sm"
            >
              Top up credits
            </Link>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
            <h2 className="text-sm font-medium text-[var(--color-text)]">
              Quick actions
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Link
                href="/summarize"
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 hover:bg-[var(--color-muted)]"
              >
                Text → Summary
              </Link>
              <Link
                href="/summarize?tab=diagram"
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 hover:bg-[var(--color-muted)]"
              >
                Text → Diagram
              </Link>
              <Link
                href="/summarize?src=youtube"
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 hover:bg-[var(--color-muted)]"
              >
                YouTube → Summary
              </Link>
              <Link
                href="/summarize?src=url"
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 hover:bg-[var(--color-muted)]"
              >
                URL → Summary
              </Link>
            </div>
          </div>

          {/* Tips / Announcements */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
            <h2 className="text-sm font-medium text-[var(--color-text)]">
              What’s new
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[color-mix(in_oklab,var(--color-foreground),transparent_20%)]">
              <li>
                • Diagram style selector now supports presets (Classic /
                Brutalist / Cute)
              </li>
              <li>
                • OTP login UX improved (clear focus + message visibility)
              </li>
              <li>• Billing: credit packs 100 / 300 / 1000 added</li>
            </ul>
          </div>
        </section>

        {/* Recent summaries */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Recent summaries
            </h2>
            <Link
              href="/summaries"
              className="text-sm underline text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
            >
              View all
            </Link>
          </div>

          {!summaries || summaries.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
              <p className="text-sm text-[color-mix(in_oklab,var(--color-foreground),transparent_25%)]">
                No summaries yet.
              </p>
              <Link
                href="/summarize"
                className="mt-3 inline-block rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] px-4 py-2 text-sm text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-sm"
              >
                Create your first summary
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
              <div className="grid grid-cols-[1.2fr_0.6fr_0.8fr_0.6fr_0.6fr] border-b border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[color-mix(in_oklab,var(--color-foreground),transparent_35%)]">
                <div>Title</div>
                <div>Source</div>
                <div>Created</div>
                <div>Status</div>
                <div className="text-right">Action</div>
              </div>
              <ul className="divide-y divide-[var(--color-border)]">
                {summaries.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[1.2fr_0.6fr_0.8fr_0.6fr_0.6fr] items-center px-4 py-3 text-sm"
                  >
                    <div className="truncate text-[var(--color-text)]">
                      {s.title || "Untitled"}
                    </div>
                    <div className="truncate text-[color-mix(in_oklab,var(--color-foreground),transparent_25%)]">
                      {s.source_type || "manual"}
                    </div>
                    <div className="truncate text-[color-mix(in_oklab,var(--color-foreground),transparent_25%)]">
                      {fmtDate(s.created_at)}
                    </div>
                    <div>
                      <span className="rounded-full border px-2 py-0.5 text-xs text-[color-mix(in_oklab,var(--color-foreground),transparent_10%)]">
                        {s.status || "done"}
                      </span>
                    </div>
                    <div className="text-right">
                      <Link
                        href={`/summary/${s.id}`}
                        className="underline text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
