import { NextResponse } from "next/server";
import { requireBlogAdmin } from "@/app/api/admin/blog/_auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBlogAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const { id } = await params;
  const reservationId = cleanString(id);

  if (!reservationId) {
    return NextResponse.json({ error: "reservation_id_required" }, { status: 400 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  const backendToken = process.env.BRIFY_BACKEND_INTERNAL_TOKEN;

  if (!backendUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_BASE_URL is not set" },
      { status: 500 }
    );
  }
  if (!backendToken) {
    return NextResponse.json(
      { error: "BRIFY_BACKEND_INTERNAL_TOKEN is not set" },
      { status: 500 }
    );
  }

  const response = await fetch(
    `${backendUrl}/internal/maps/youtube-reservations/${encodeURIComponent(
      reservationId
    )}/send-complete-email`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${backendToken}`,
      },
      cache: "no-store",
    }
  );

  const json = await response.json().catch(() => ({}));
  return NextResponse.json(json, { status: response.status });
}
