import type {
  BillingCatalogItem,
  BillingCurrency,
  BillingPackCode,
  BillingProductCode,
  BillingProvider,
} from "@/app/lib/billing/catalog";
import { adminSupabase } from "@/utils/supabase/admin";

const LEMON_CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMON_CHECKOUT || null;

type FetchBillingCatalogOptions = {
  userId?: string | null;
};

function getProvider(currency: BillingCurrency): BillingProvider {
  return currency === "krw" ? "toss" : "lemon_squeezy";
}

function getProductCode(credits: number): BillingProductCode | null {
  if (credits === 50) return "credit_pack_50";
  if (credits === 150) return "credit_pack_150";
  if (credits === 300) return "credit_pack_300";
  return null;
}

function getPackId(credits: number, currency: BillingCurrency): BillingPackCode | null {
  if (credits === 50 && currency === "krw") return "50_kr";
  if (credits === 150 && currency === "krw") return "150_kr";
  if (credits === 300 && currency === "krw") return "300_kr";
  if (credits === 50 && currency === "usd") return "50_us";
  if (credits === 150 && currency === "usd") return "150_us";
  if (credits === 300 && currency === "usd") return "300_us";
  return null;
}

function getOrderName(credits: number) {
  return `Brify ${credits} credits`;
}

function decoratePack(item: BillingCatalogItem): BillingCatalogItem {
  return {
    ...item,
    starter: item.credits === 50,
    popular: item.credits === 150,
  };
}

export async function fetchBillingCatalog(
  currency: BillingCurrency,
  options?: FetchBillingCatalogOptions
): Promise<BillingCatalogItem[]> {
  const { data, error } = await adminSupabase
    .from("credit_packs")
    .select("id, credits, price, currency, is_active")
    .eq("currency", currency)
    .eq("is_active", true)
    .order("credits", { ascending: true });

  if (error) {
    throw new Error(`Failed to load credit packs: ${error.message}`);
  }

  const items = (data ?? [])
    .map((row) => {
      const productCode = getProductCode(row.credits);
      const packId = getPackId(row.credits, row.currency);

      if (!productCode || !packId) {
        return null;
      }

      return decoratePack({
        id: packId,
        productCode,
        credits: row.credits,
        price: row.price,
        currency: row.currency,
        provider: getProvider(row.currency),
        orderName: getOrderName(row.credits),
        checkoutUrl: row.currency === "usd" ? LEMON_CHECKOUT_URL : null,
      });
    })
    .filter((item): item is BillingCatalogItem => item !== null);

  void options;
  return items;
}

export async function fetchBillingCatalogItemById(
  packId: string,
  options?: FetchBillingCatalogOptions
): Promise<BillingCatalogItem | null> {
  const normalized = packId.trim().toLowerCase();

  const currency = normalized.endsWith("_kr") ? "krw" : normalized.endsWith("_us") ? "usd" : null;

  if (!currency) {
    return null;
  }

  const items = await fetchBillingCatalog(currency, options);
  return items.find((item) => item.id === normalized) ?? null;
}
