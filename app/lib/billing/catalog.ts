export type BillingCurrency = "krw" | "usd";

export type BillingProvider = "toss" | "lemon_squeezy";

export type BillingProductCode =
  | "credit_pack_50"
  | "credit_pack_150"
  | "credit_pack_300";

export type BillingPackCode =
  | "50_kr"
  | "150_kr"
  | "300_kr"
  | "50_us"
  | "150_us"
  | "300_us";

export type BillingCatalogItem = {
  id: BillingPackCode;
  productCode: BillingProductCode;
  credits: number;
  price: number;
  currency: BillingCurrency;
  provider: BillingProvider;
  orderName: string;
  checkoutUrl: string | null;
  popular?: boolean;
  starter?: boolean;
};

const LEMON_CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMON_CHECKOUT || null;

const BILLING_CATALOG: Record<BillingCurrency, BillingCatalogItem[]> = {
  krw: [
    {
      id: "50_kr",
      productCode: "credit_pack_50",
      credits: 50,
      price: 3500,
      currency: "krw",
      provider: "toss",
      orderName: "Brify 50 credits",
      checkoutUrl: null,
      starter: true,
    },
    {
      id: "150_kr",
      productCode: "credit_pack_150",
      credits: 150,
      price: 9000,
      currency: "krw",
      provider: "toss",
      orderName: "Brify 150 credits",
      checkoutUrl: null,
      popular: true,
    },
    {
      id: "300_kr",
      productCode: "credit_pack_300",
      credits: 300,
      price: 15000,
      currency: "krw",
      provider: "toss",
      orderName: "Brify 300 credits",
      checkoutUrl: null,
    },
  ],
  usd: [
    {
      id: "50_us",
      productCode: "credit_pack_50",
      credits: 50,
      price: 3,
      currency: "usd",
      provider: "lemon_squeezy",
      orderName: "Brify 50 credits",
      checkoutUrl: LEMON_CHECKOUT_URL,
      starter: true,
    },
    {
      id: "150_us",
      productCode: "credit_pack_150",
      credits: 150,
      price: 7,
      currency: "usd",
      provider: "lemon_squeezy",
      orderName: "Brify 150 credits",
      checkoutUrl: LEMON_CHECKOUT_URL,
      popular: true,
    },
    {
      id: "300_us",
      productCode: "credit_pack_300",
      credits: 300,
      price: 12,
      currency: "usd",
      provider: "lemon_squeezy",
      orderName: "Brify 300 credits",
      checkoutUrl: LEMON_CHECKOUT_URL,
    },
  ],
};

export function getBillingCurrencyByLocale(locale: string): BillingCurrency {
  return locale === "ko" ? "krw" : "usd";
}

export function getBillingCatalog(locale: string): BillingCatalogItem[] {
  const currency = getBillingCurrencyByLocale(locale);
  return [...BILLING_CATALOG[currency]].sort((a, b) => a.credits - b.credits);
}

export function getBillingCatalogItemById(
  packId: string
): BillingCatalogItem | null {
  const allItems = [...BILLING_CATALOG.krw, ...BILLING_CATALOG.usd];
  return allItems.find((item) => item.id === packId) ?? null;
}
