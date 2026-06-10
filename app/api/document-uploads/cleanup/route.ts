import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { adminSupabase } from "@/utils/supabase/admin";
import { DOCUMENT_UPLOAD_BUCKET } from "../shared";

export const runtime = "nodejs";

const CLEANUP_OLDER_THAN_HOURS = 6;

type StorageObject = {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

function isCronAuthorized(req: NextRequest) {
  const secret =
    process.env.DOCUMENT_UPLOAD_CLEANUP_SECRET ?? process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function isAdminRequest() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return data?.role === "ADMIN";
}

async function collectExpiredPaths(
  prefix: string,
  cutoff: number,
  paths: string[]
) {
  const { data, error } = await adminSupabase.storage
    .from(DOCUMENT_UPLOAD_BUCKET)
    .list(prefix, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    console.error("[document-uploads/cleanup] list failed", {
      prefix,
      message: error.message,
      name: error.name,
    });
    return;
  }

  for (const item of (data ?? []) as StorageObject[]) {
    const name = item.name;
    if (!name) continue;

    const path = prefix ? `${prefix}/${name}` : name;
    if (!item.id) {
      await collectExpiredPaths(path, cutoff, paths);
      continue;
    }

    const timestamp = Date.parse(
      item.updated_at ?? item.created_at ?? ""
    );
    if (Number.isFinite(timestamp) && timestamp < cutoff) {
      paths.push(path);
    }
  }
}

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req) && !(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cutoff = Date.now() - CLEANUP_OLDER_THAN_HOURS * 60 * 60 * 1000;
  const paths: string[] = [];
  await collectExpiredPaths("", cutoff, paths);

  let deleted = 0;
  for (let index = 0; index < paths.length; index += 100) {
    const chunk = paths.slice(index, index + 100);
    const { error } = await adminSupabase.storage
      .from(DOCUMENT_UPLOAD_BUCKET)
      .remove(chunk);

    if (error) {
      console.error("[document-uploads/cleanup] remove failed", {
        count: chunk.length,
        message: error.message,
        name: error.name,
      });
      continue;
    }
    deleted += chunk.length;
  }

  return NextResponse.json({
    success: true,
    scanned: paths.length,
    deleted,
    olderThanHours: CLEANUP_OLDER_THAN_HOURS,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
