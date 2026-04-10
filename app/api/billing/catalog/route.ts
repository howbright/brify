import { NextRequest, NextResponse } from "next/server";
import { fetchBillingCatalog } from "@/app/lib/billing/catalog.server";
import type { BillingCurrency } from "@/app/lib/billing/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const currencyParam = req.nextUrl.searchParams.get("currency")?.trim().toLowerCase();
  const currency: BillingCurrency | null =
    currencyParam === "krw" || currencyParam === "usd" ? currencyParam : null;

  if (!currency) {
    return NextResponse.json({ error: "currency must be krw or usd" }, { status: 400 });
  }

  try {
    const items = await fetchBillingCatalog(currency);
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load billing catalog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
