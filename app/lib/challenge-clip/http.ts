import { NextResponse } from "next/server";

export function jsonNoStore(payload: unknown, status = 200, headers = {}) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export function jsonError(error: unknown) {
  console.error(error);
  return jsonNoStore(
    {
      error: error instanceof Error ? error.message : "Internal server error",
    },
    500
  );
}
