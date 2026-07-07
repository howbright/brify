import { NextResponse } from "next/server";
import { requireBlogAdmin } from "@/app/api/admin/blog/_auth";
import { deleteAccountData } from "@/app/lib/admin/deleteAccountData";
import { adminSupabase } from "@/utils/supabase/admin";

const TEST_ACCOUNT_EMAIL = "howbright22@gmail.com";

async function listAuthUserIdsByEmail(email: string) {
  const ids = new Set<string>();
  const target = email.trim().toLowerCase();
  const perPage = 1000;
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`auth.listUsers: ${error.message}`);
    }

    const users = data.users ?? [];
    for (const user of users) {
      if (user.email?.trim().toLowerCase() === target) {
        ids.add(user.id);
      }
    }

    if (users.length < perPage) break;
  }

  return Array.from(ids);
}

export async function POST() {
  const admin = await requireBlogAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: admin.status });
  }

  try {
    const { data: profiles, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id,email")
      .eq("email", TEST_ACCOUNT_EMAIL);

    if (profileError) {
      throw new Error(`profiles.select: ${profileError.message}`);
    }

    const profileIds = (profiles ?? []).map((profile) => profile.id);
    const authIds = await listAuthUserIdsByEmail(TEST_ACCOUNT_EMAIL);
    const userIds = Array.from(new Set([...profileIds, ...authIds]));

    for (const userId of userIds) {
      await deleteAccountData(userId, { deleteAuthUser: true });
    }

    return NextResponse.json({
      ok: true,
      email: TEST_ACCOUNT_EMAIL,
      deletedUserIds: userIds,
      deletedCount: userIds.length,
    });
  } catch (error) {
    console.error("[admin/test-account/reset] failed", {
      email: TEST_ACCOUNT_EMAIL,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "reset_failed",
        detail: error instanceof Error ? error.message : null,
      },
      { status: 500 }
    );
  }
}
