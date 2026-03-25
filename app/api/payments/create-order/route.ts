import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getBillingCatalogItemById } from "@/app/lib/billing/catalog";
import { createClient } from "@/utils/supabase/server";
import { adminSupabase } from "@/utils/supabase/admin";

export const runtime = "nodejs";

type CreateOrderBody = {
  packId?: string;
};

function buildProviderOrderId(packId: string) {
  const compactId = randomUUID().replace(/-/g, "").slice(0, 12);
  return `brify_${packId}_${Date.now()}_${compactId}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateOrderBody;
  try {
    body = (await req.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const packId = body.packId?.trim();
  if (!packId) {
    return NextResponse.json({ error: "packId is required" }, { status: 400 });
  }

  const catalogItem = getBillingCatalogItemById(packId);
  if (!catalogItem) {
    return NextResponse.json({ error: "Unknown pack" }, { status: 404 });
  }

  const { data: dbPack, error: dbPackError } = await adminSupabase
    .from("credit_packs")
    .select("id, credits, price, currency, is_active")
    .eq("id", packId)
    .eq("is_active", true)
    .single();

  if (dbPackError || !dbPack) {
    console.error("Active credit pack not found:", packId, dbPackError?.message);
    return NextResponse.json(
      { error: "Credit pack is not available" },
      { status: 400 }
    );
  }

  const isCatalogMismatch =
    dbPack.credits !== catalogItem.credits ||
    dbPack.price !== catalogItem.price ||
    dbPack.currency !== catalogItem.currency;

  if (isCatalogMismatch) {
    console.error("Billing catalog mismatch:", {
      packId,
      dbPack,
      catalogItem,
    });
    return NextResponse.json(
      { error: "Billing pack is misconfigured" },
      { status: 500 }
    );
  }

  const providerOrderId = buildProviderOrderId(packId);

  const { data: payment, error: paymentError } = await adminSupabase
    .from("payments")
    .insert({
      user_id: user.id,
      provider: catalogItem.provider,
      provider_order_id: providerOrderId,
      status: "pending",
      amount: catalogItem.price,
      currency: catalogItem.currency,
      credits: catalogItem.credits,
      credit_pack_id: dbPack.id,
      raw_payload: {
        source: "create-order",
        pack_id: catalogItem.id,
        product_code: catalogItem.productCode,
      },
    })
    .select("id, amount, credits, currency, provider, provider_order_id, status")
    .single();

  if (paymentError || !payment) {
    console.error("Failed to create payment order:", paymentError?.message);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    orderId: payment.provider_order_id,
    amount: payment.amount,
    orderName: catalogItem.orderName,
    provider: payment.provider,
    currency: payment.currency,
    credits: payment.credits,
    paymentId: payment.id,
  });
}
