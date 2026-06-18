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

export function getBillingCurrencyByLocale(locale: string): BillingCurrency {
  return locale === "ko" ? "krw" : "usd";
}
