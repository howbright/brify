import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import type { Database, Json } from "@/app/types/database.types";
import { adminSupabase } from "@/utils/supabase/admin";

const PACKAGE_NAME =
  process.env.CHALLENGECLIP_PACKAGE_NAME ||
  process.env.GOOGLE_PLAY_PACKAGE_NAME ||
  "com.challengeclip.app";
const PRO_PRODUCT_ID = process.env.CHALLENGECLIP_PRODUCT_ID || "pro_lifetime";
const ADMIN_SECRET =
  process.env.CHALLENGECLIP_ADMIN_SECRET || process.env.ADMIN_SECRET || "";
const ANDROID_PUBLISHER_SCOPE =
  "https://www.googleapis.com/auth/androidpublisher";
const DEVICE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Tables = Database["public"]["Tables"];
type DeviceRow = Tables["challenge_clip_devices"]["Row"];
type PurchaseRow = Tables["challenge_clip_purchases"]["Row"];
type PurchaseInsert = Tables["challenge_clip_purchases"]["Insert"];
type PurchaseUpdate = Tables["challenge_clip_purchases"]["Update"];
type ProUsageEventRow = Tables["challenge_clip_pro_usage_events"]["Row"];

type Result<T> = {
  status: number;
  payload: T;
};

type EntitlementPayload = {
  deviceUserId: string | null;
  isPro: boolean;
  status: string;
  productId: string;
  updatedAt: string | null;
};

type ProUsageSummary = {
  hasUsedProBenefit: boolean;
  eventCount: number;
  firstUsedAt: string | null;
  latestUsedAt: string | null;
  events: ProUsageEventRow[];
};

const PRO_USAGE_EVENT_TYPES = new Set([
  "created_extra_challenge",
  "created_extra_clip",
]);

type GoogleProductPurchase = {
  orderId?: string;
  purchaseState?: number;
  consumptionState?: number;
  acknowledgementState?: number;
  purchaseTimeMillis?: string;
  [key: string]: unknown;
};

type VoidedPurchase = {
  purchaseToken?: string;
  orderId?: string;
  voidedTimeMillis?: string;
  voidedReason?: number;
  refundType?: number;
  [key: string]: unknown;
};

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0;

function isoNow() {
  return new Date().toISOString();
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function base64Url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function googleCredentials() {
  const serviceAccountJson =
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    "";

  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson) as {
      client_email?: string;
      private_key?: string;
    };

    return {
      email: parsed.client_email || "",
      privateKey: String(parsed.private_key || "").replace(/\\n/g, "\n"),
    };
  }

  return {
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
    privateKey: String(
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || ""
    ).replace(/\\n/g, "\n"),
  };
}

function requireGoogleCredentials() {
  const { email, privateKey } = googleCredentials();
  if (!email || !privateKey) {
    throw new Error("Google Play service account credentials are not configured");
  }
  return { email, privateKey };
}

async function getAccessToken() {
  const { email, privateKey } = requireGoogleCredentials();
  const now = Math.floor(Date.now() / 1000);

  if (cachedAccessToken && cachedAccessTokenExpiresAt - 60 > now) {
    return cachedAccessToken;
  }

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: email,
      scope: ANDROID_PUBLISHER_SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );
  const unsignedJwt = `${header}.${claim}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsignedJwt)
    .sign(privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const assertion = `${unsignedJwt}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      `OAuth token request failed: ${
        payload.error_description || payload.error || response.statusText
      }`
    );
  }

  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt = now + Number(payload.expires_in || 3600);
  return cachedAccessToken;
}

async function googlePlayGet<T>(pathname: string, query: Record<string, unknown> = {}) {
  const accessToken = await getAccessToken();
  const url = new URL(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/${pathname}`
  );

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const payload = (await response.json()) as T & {
    error?: { message?: string } | string;
  };

  if (!response.ok) {
    const message =
      typeof payload.error === "object"
        ? payload.error?.message
        : payload.error || response.statusText;
    throw new Error(`Google Play API failed: ${message}`);
  }

  return payload;
}

async function googlePlayPost<T>(
  pathname: string,
  query: Record<string, unknown> = {},
  body?: unknown
) {
  const accessToken = await getAccessToken();
  const url = new URL(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/${pathname}`
  );

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const payload = text
    ? ((JSON.parse(text) as T & { error?: { message?: string } | string }))
    : ({} as T & { error?: { message?: string } | string });

  if (!response.ok) {
    const message =
      typeof payload.error === "object"
        ? payload.error?.message
        : payload.error || response.statusText;
    throw new Error(`Google Play API failed: ${message}`);
  }

  return payload;
}

async function acknowledgeProductPurchase(productId: string, purchaseToken: string) {
  await googlePlayPost(
    `applications/${encodeURIComponent(
      PACKAGE_NAME
    )}/purchases/products/${encodeURIComponent(
      productId
    )}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
    {},
    {}
  );
}

async function consumeProductPurchase(productId: string, purchaseToken: string) {
  await googlePlayPost(
    `applications/${encodeURIComponent(
      PACKAGE_NAME
    )}/purchases/products/${encodeURIComponent(
      productId
    )}/tokens/${encodeURIComponent(purchaseToken)}:consume`
  );
}

function assertSupabase<T>(data: T, error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

function assertSupabaseRow<T>(
  data: T | null,
  error: { message: string } | null,
  label: string
) {
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error(`${label} was not returned from Supabase`);
  }
  return data;
}

async function audit({
  deviceId = null,
  purchaseId = null,
  action,
  reason = null,
  metadata = null,
}: {
  deviceId?: string | null;
  purchaseId?: string | null;
  action: string;
  reason?: string | null;
  metadata?: Json | null;
}) {
  const { error } = await adminSupabase
    .from("challenge_clip_entitlement_audits")
    .insert({
      device_id: deviceId,
      purchase_id: purchaseId,
      action,
      reason,
      metadata,
    });

  assertSupabase(null, error);
}

async function ensureDevice(deviceId: string) {
  const { data, error } = await adminSupabase
    .from("challenge_clip_devices")
    .upsert({ id: deviceId, last_seen_at: isoNow() }, { onConflict: "id" })
    .select("*")
    .single();

  return assertSupabaseRow(data, error, "Device");
}

function entitlementPayload(device: DeviceRow | null): EntitlementPayload {
  const status = device?.entitlement_status || "inactive";

  return {
    deviceUserId: device?.id || null,
    isPro: status === "active" || status === "manual_granted",
    status,
    productId: PRO_PRODUCT_ID,
    updatedAt: device?.updated_at || null,
  };
}

async function getLinkedPurchases(deviceId: string) {
  const { data: links, error: linksError } = await adminSupabase
    .from("challenge_clip_device_purchases")
    .select("purchase_id")
    .eq("device_id", deviceId);
  assertSupabase(links, linksError);

  const purchaseIds = [...new Set((links || []).map((link) => link.purchase_id))];
  if (purchaseIds.length === 0) return [];

  const { data, error } = await adminSupabase
    .from("challenge_clip_purchases")
    .select("*")
    .in("id", purchaseIds);

  return assertSupabase(data || [], error);
}

async function getProUsageEventsForDevice(deviceId: string) {
  const { data, error } = await adminSupabase
    .from("challenge_clip_pro_usage_events")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(50);

  return assertSupabase(data || [], error);
}

async function getProUsageEventsForPurchase(purchaseId: string) {
  const { data, error } = await adminSupabase
    .from("challenge_clip_pro_usage_events")
    .select("*")
    .eq("purchase_id", purchaseId)
    .order("created_at", { ascending: false })
    .limit(50);

  return assertSupabase(data || [], error);
}

function proUsageSummary(events: ProUsageEventRow[]): ProUsageSummary {
  const sorted = [...events].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );

  return {
    hasUsedProBenefit: events.length > 0,
    eventCount: events.length,
    firstUsedAt: sorted[0]?.created_at || null,
    latestUsedAt: sorted[sorted.length - 1]?.created_at || null,
    events,
  };
}

async function recalculateDeviceEntitlement(deviceId: string) {
  const device = await ensureDevice(deviceId);
  const purchases = await getLinkedPurchases(deviceId);
  const activePurchase = purchases.find((purchase) => purchase.status === "active");

  if (
    device.entitlement_status === "manual_granted" ||
    (device.entitlement_status === "manual_revoked" && !activePurchase)
  ) {
    return device;
  }

  const voidedPurchase = purchases.find((purchase) => purchase.status === "voided");
  const refundedPurchase = purchases.find(
    (purchase) => purchase.status === "refunded"
  );
  const status = activePurchase
    ? "active"
    : voidedPurchase
      ? "voided"
      : refundedPurchase
        ? "refunded"
        : "inactive";

  const { data, error } = await adminSupabase
    .from("challenge_clip_devices")
    .update({
      entitlement_status: status,
      active_purchase_id: activePurchase?.id || null,
      last_verified_at: isoNow(),
    })
    .eq("id", deviceId)
    .select("*")
    .single();

  return assertSupabaseRow(data, error, "Device");
}

export async function getEntitlement(deviceId: string) {
  const device = await recalculateDeviceEntitlement(deviceId);
  return entitlementPayload(device);
}

function validateProUsageEventBody({
  deviceUserId,
  eventType,
}: {
  deviceUserId?: string;
  eventType?: string;
}) {
  if (!deviceUserId || !eventType) {
    return "deviceUserId and eventType are required";
  }

  if (!DEVICE_ID_PATTERN.test(deviceUserId)) {
    return "Invalid deviceUserId";
  }

  if (!PRO_USAGE_EVENT_TYPES.has(eventType)) {
    return "Invalid Pro usage eventType";
  }

  return null;
}

export async function recordProUsageEvent({
  deviceUserId,
  eventType,
  metadata = null,
}: {
  deviceUserId?: string;
  eventType?: string;
  metadata?: Json | null;
}): Promise<Result<Record<string, unknown>>> {
  const validationError = validateProUsageEventBody({ deviceUserId, eventType });
  if (validationError) {
    return { status: 400, payload: { error: validationError } };
  }

  const verifiedDeviceUserId = deviceUserId as string;
  const verifiedEventType = eventType as string;
  const device = await recalculateDeviceEntitlement(verifiedDeviceUserId);
  if (device.entitlement_status !== "active" && device.entitlement_status !== "manual_granted") {
    return {
      status: 409,
      payload: {
        error: "Device does not have active Pro entitlement",
        ...entitlementPayload(device),
      },
    };
  }

  const { data, error } = await adminSupabase
    .from("challenge_clip_pro_usage_events")
    .insert({
      device_id: verifiedDeviceUserId,
      purchase_id: device.active_purchase_id,
      event_type: verifiedEventType,
      metadata,
    })
    .select("*")
    .single();
  const event = assertSupabaseRow(data, error, "Pro usage event");

  await audit({
    deviceId: verifiedDeviceUserId,
    purchaseId: device.active_purchase_id,
    action: "pro_usage_recorded",
    metadata: {
      eventType: verifiedEventType,
      usageEventId: event.id,
    },
  });

  return {
    status: 200,
    payload: {
      recorded: true,
      proUsage: proUsageSummary(await getProUsageEventsForDevice(verifiedDeviceUserId)),
    },
  };
}

async function linkDevicePurchase(deviceId: string, purchaseId: string) {
  const { error } = await adminSupabase
    .from("challenge_clip_device_purchases")
    .upsert(
      {
        device_id: deviceId,
        purchase_id: purchaseId,
      },
      { onConflict: "device_id,purchase_id" }
    );

  assertSupabase(null, error);
}

async function connectedDeviceIds(purchaseId: string) {
  const { data, error } = await adminSupabase
    .from("challenge_clip_device_purchases")
    .select("device_id")
    .eq("purchase_id", purchaseId);
  assertSupabase(data, error);

  return [...new Set((data || []).map((link) => link.device_id))];
}

async function selectPurchaseByTokenHash(tokenHash: string) {
  const { data, error } = await adminSupabase
    .from("challenge_clip_purchases")
    .select("*")
    .eq("purchase_token_hash", tokenHash)
    .maybeSingle();

  return assertSupabase(data, error);
}

async function selectPurchaseByOrderId(orderId: string) {
  const { data, error } = await adminSupabase
    .from("challenge_clip_purchases")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  return assertSupabase(data, error);
}

async function upsertPurchase(purchase: PurchaseInsert) {
  const { data, error } = await adminSupabase
    .from("challenge_clip_purchases")
    .upsert(purchase, { onConflict: "purchase_token_hash" })
    .select("*")
    .single();

  return assertSupabaseRow(data, error, "Purchase");
}

async function updatePurchase(id: string, patch: PurchaseUpdate) {
  const { data, error } = await adminSupabase
    .from("challenge_clip_purchases")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  return assertSupabaseRow(data, error, "Purchase");
}

function mergeGooglePayload(
  payload: Json | null,
  key: string,
  value: Json
): Json {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return { ...payload, [key]: value };
  }

  return { [key]: value };
}

function validateVerifyRequestBody({
  deviceUserId,
  productId,
  purchaseToken,
}: {
  deviceUserId?: string;
  productId?: string;
  purchaseToken?: string;
}) {
  if (!deviceUserId || !productId || !purchaseToken) {
    return "deviceUserId, productId, purchaseToken are required";
  }
  if (typeof deviceUserId !== "string" || !DEVICE_ID_PATTERN.test(deviceUserId)) {
    return "Invalid deviceUserId";
  }
  if (productId !== PRO_PRODUCT_ID) {
    return "Unsupported productId";
  }
  if (
    typeof purchaseToken !== "string" ||
    purchaseToken.length < 20 ||
    purchaseToken.length > 4096
  ) {
    return "Invalid purchaseToken";
  }
  return null;
}

export async function verifyProductPurchase({
  deviceUserId,
  productId,
  purchaseToken,
}: {
  deviceUserId?: string;
  productId?: string;
  purchaseToken?: string;
}): Promise<Result<Record<string, unknown>>> {
  const validationError = validateVerifyRequestBody({
    deviceUserId,
    productId,
    purchaseToken,
  });
  if (validationError) {
    return { status: 400, payload: { error: validationError } };
  }

  const verifiedDeviceUserId = deviceUserId as string;
  const verifiedProductId = productId as string;
  const verifiedPurchaseToken = purchaseToken as string;

  await ensureDevice(verifiedDeviceUserId);
  const purchaseTokenHash = sha256(verifiedPurchaseToken);
  const existing = await selectPurchaseByTokenHash(purchaseTokenHash);
  const playPurchase = await googlePlayGet<GoogleProductPurchase>(
    `applications/${encodeURIComponent(
      PACKAGE_NAME
    )}/purchases/products/${encodeURIComponent(
      verifiedProductId
    )}/tokens/${encodeURIComponent(verifiedPurchaseToken)}`
  );
  const purchaseState = Number(playPurchase.purchaseState ?? 1);
  const googleActive = purchaseState === 0;
  const preservedVoidedStatus =
    !googleActive &&
    (existing?.status === "voided" || existing?.status === "refunded");
  const nextStatus = googleActive
    ? "active"
    : preservedVoidedStatus
      ? existing.status
      : "invalid";
  let acknowledgementState = Number(playPurchase.acknowledgementState ?? 0);
  let serverAcknowledged = false;
  let serverAcknowledgeError: string | null = null;

  if (nextStatus === "active" && acknowledgementState !== 1) {
    try {
      await acknowledgeProductPurchase(verifiedProductId, verifiedPurchaseToken);
      acknowledgementState = 1;
      serverAcknowledged = true;
    } catch (error) {
      serverAcknowledgeError =
        error instanceof Error ? error.message : "Server acknowledge failed";
    }
  }

  const purchase = await upsertPurchase({
    product_id: verifiedProductId,
    purchase_token_hash: purchaseTokenHash,
    order_id: playPurchase.orderId || existing?.order_id || null,
    purchase_state: purchaseState,
    consumption_state: Number(playPurchase.consumptionState ?? 0),
    acknowledgement_state: acknowledgementState,
    purchase_time_millis:
      playPurchase.purchaseTimeMillis || existing?.purchase_time_millis || null,
    status: nextStatus,
    raw_google_payload: {
      ...playPurchase,
      serverAcknowledged,
      ...(serverAcknowledgeError ? { serverAcknowledgeError } : {}),
    } as Json,
  });

  await linkDevicePurchase(verifiedDeviceUserId, purchase.id);
  await audit({
    deviceId: verifiedDeviceUserId,
    purchaseId: purchase.id,
    action: nextStatus === "active" ? "verify_active" : "verify_inactive",
    metadata: {
      purchaseState,
      orderId: purchase.order_id,
      serverAcknowledged,
      serverAcknowledgeError,
    },
  });

  const device = await recalculateDeviceEntitlement(verifiedDeviceUserId);
  return {
    status: 200,
    payload: {
      ...entitlementPayload(device),
      purchaseState,
      acknowledgementState: purchase.acknowledgement_state,
      orderId: purchase.order_id,
    },
  };
}

async function markPurchaseVoided({
  purchase,
  status,
  voidedPurchase,
}: {
  purchase: PurchaseRow;
  status: string;
  voidedPurchase: VoidedPurchase;
}) {
  const updatedPurchase = await updatePurchase(purchase.id, {
    status,
    order_id: voidedPurchase.orderId || purchase.order_id || null,
    voided_at: voidedPurchase.voidedTimeMillis
      ? new Date(Number(voidedPurchase.voidedTimeMillis)).toISOString()
      : isoNow(),
    voided_reason: voidedPurchase.voidedReason ?? null,
    refund_type: voidedPurchase.refundType ?? null,
    raw_google_payload: mergeGooglePayload(
      purchase.raw_google_payload,
      "voidedPurchase",
      voidedPurchase as Json
    ),
  });

  const deviceIds = await connectedDeviceIds(purchase.id);
  for (const deviceId of deviceIds) {
    await recalculateDeviceEntitlement(deviceId);
    await audit({
      deviceId,
      purchaseId: purchase.id,
      action: `${status}_detected`,
      metadata: { orderId: updatedPurchase.order_id },
    });
  }

  return deviceIds.length;
}

export async function syncVoidedPurchases() {
  const now = Date.now();
  const { data: syncState, error } = await adminSupabase
    .from("challenge_clip_void_sync_state")
    .select("*")
    .eq("id", "default")
    .maybeSingle();
  assertSupabase(syncState, error);

  const maxLookbackStartTime = now - 29 * 24 * 60 * 60 * 1000;
  const savedStartTime = Number(syncState?.last_sync_time_millis || 0);
  const startTime = Math.max(savedStartTime || maxLookbackStartTime, maxLookbackStartTime);
  let token: string | undefined;
  let voidedCount = 0;
  let affectedDevices = 0;

  do {
    const payload = await googlePlayGet<{
      voidedPurchases?: VoidedPurchase[];
      tokenPagination?: { nextPageToken?: string };
    }>(
      `applications/${encodeURIComponent(
        PACKAGE_NAME
      )}/purchases/voidedpurchases`,
      {
        startTime,
        endTime: now,
        token,
      }
    );

    for (const voidedPurchase of payload.voidedPurchases || []) {
      const purchaseTokenHash = voidedPurchase.purchaseToken
        ? sha256(voidedPurchase.purchaseToken)
        : null;
      const orderId = voidedPurchase.orderId || null;
      const purchase = purchaseTokenHash
        ? await selectPurchaseByTokenHash(purchaseTokenHash)
        : orderId
          ? await selectPurchaseByOrderId(orderId)
          : null;

      if (!purchase) continue;

      const status =
        Number(voidedPurchase.refundType ?? 1) === 1 ? "refunded" : "voided";
      affectedDevices += await markPurchaseVoided({
        purchase,
        status,
        voidedPurchase,
      });
      voidedCount += 1;
    }

    token = payload.tokenPagination?.nextPageToken;
  } while (token);

  const { error: upsertError } = await adminSupabase
    .from("challenge_clip_void_sync_state")
    .upsert(
      {
        id: "default",
        last_sync_time_millis: String(now),
      },
      { onConflict: "id" }
    );
  assertSupabase(null, upsertError);

  return {
    voidedCount,
    affectedDevices,
    syncedThrough: new Date(now).toISOString(),
  };
}

export async function refundOrder({
  orderId,
  revoke = true,
}: {
  orderId?: string;
  revoke?: boolean;
}): Promise<Result<Record<string, unknown>>> {
  if (!orderId) {
    return { status: 400, payload: { error: "orderId is required" } };
  }

  await googlePlayPost(
    `applications/${encodeURIComponent(
      PACKAGE_NAME
    )}/orders/${encodeURIComponent(orderId)}:refund`,
    { revoke: Boolean(revoke) }
  );

  const purchase = await selectPurchaseByOrderId(orderId);
  let affectedDevices = 0;

  if (purchase) {
    const updatedPurchase = await updatePurchase(purchase.id, {
      status: revoke ? "voided" : "refunded",
      voided_at: isoNow(),
      voided_reason: revoke ? 1 : null,
      refund_type: revoke ? 1 : 0,
    });
    const deviceIds = await connectedDeviceIds(purchase.id);

    for (const deviceId of deviceIds) {
      await recalculateDeviceEntitlement(deviceId);
      await audit({
        deviceId,
        purchaseId: updatedPurchase.id,
        action: revoke ? "manual_refund_revoke" : "manual_refund",
        metadata: { orderId },
      });
      affectedDevices += 1;
    }
  }

  return {
    status: 200,
    payload: {
      refunded: true,
      revoked: Boolean(revoke),
      orderId,
      affectedDevices,
    },
  };
}

export async function inspectPurchaseToken({
  productId = PRO_PRODUCT_ID,
  purchaseToken,
}: {
  productId?: string;
  purchaseToken?: string;
}): Promise<Result<Record<string, unknown>>> {
  const trimmedProductId = String(productId || "").trim();
  const trimmedPurchaseToken = String(purchaseToken || "").trim();

  if (!trimmedProductId) {
    return { status: 400, payload: { error: "productId is required" } };
  }

  if (!trimmedPurchaseToken) {
    return { status: 400, payload: { error: "purchaseToken is required" } };
  }

  if (trimmedPurchaseToken.length < 20 || trimmedPurchaseToken.length > 4096) {
    return {
      status: 400,
      payload: { error: "purchaseToken length is invalid" },
    };
  }

  const purchase = await googlePlayGet<GoogleProductPurchase>(
    `applications/${encodeURIComponent(
      PACKAGE_NAME
    )}/purchases/products/${encodeURIComponent(
      trimmedProductId
    )}/tokens/${encodeURIComponent(trimmedPurchaseToken)}`
  );

  const purchaseStateLabel =
    purchase.purchaseState === 0
      ? "purchased"
      : purchase.purchaseState === 1
        ? "canceled"
        : purchase.purchaseState === 2
          ? "pending"
          : "unknown";
  const acknowledgementStateLabel =
    purchase.acknowledgementState === 1
      ? "acknowledged"
      : purchase.acknowledgementState === 0
        ? "not_acknowledged"
        : "unknown";

  return {
    status: 200,
    payload: {
      productId: trimmedProductId,
      tokenHash: sha256(trimmedPurchaseToken),
      orderId: purchase.orderId ?? null,
      purchaseState: purchase.purchaseState ?? null,
      purchaseStateLabel,
      acknowledgementState: purchase.acknowledgementState ?? null,
      acknowledgementStateLabel,
      consumptionState: purchase.consumptionState ?? null,
      purchaseTimeMillis: purchase.purchaseTimeMillis ?? null,
      purchaseTime: purchase.purchaseTimeMillis
        ? new Date(Number(purchase.purchaseTimeMillis)).toISOString()
        : null,
      rawGooglePayload: purchase,
    },
  };
}

export async function consumeCanceledPurchaseToken({
  productId = PRO_PRODUCT_ID,
  purchaseToken,
}: {
  productId?: string;
  purchaseToken?: string;
}): Promise<Result<Record<string, unknown>>> {
  const inspected = await inspectPurchaseToken({ productId, purchaseToken });
  if (inspected.status !== 200) {
    return inspected;
  }

  const payload = inspected.payload as {
    productId?: string;
    tokenHash?: string;
    orderId?: string | null;
    purchaseState?: number | null;
    purchaseStateLabel?: string;
    consumptionState?: number | null;
  };

  if (payload.purchaseState !== 1) {
    return {
      status: 409,
      payload: {
        error: "Only canceled purchase tokens can be consumed from this admin action",
        purchaseState: payload.purchaseState,
        purchaseStateLabel: payload.purchaseStateLabel,
        consumptionState: payload.consumptionState,
        orderId: payload.orderId ?? null,
      },
    };
  }

  if (payload.consumptionState === 1) {
    return {
      status: 200,
      payload: {
        consumed: true,
        alreadyConsumed: true,
        productId: payload.productId,
        tokenHash: payload.tokenHash,
        orderId: payload.orderId ?? null,
        purchaseState: payload.purchaseState,
        purchaseStateLabel: payload.purchaseStateLabel,
        consumptionState: payload.consumptionState,
      },
    };
  }

  const trimmedProductId = String(productId || PRO_PRODUCT_ID).trim();
  const trimmedPurchaseToken = String(purchaseToken || "").trim();
  await consumeProductPurchase(trimmedProductId, trimmedPurchaseToken);

  return {
    status: 200,
    payload: {
      consumed: true,
      alreadyConsumed: false,
      productId: payload.productId,
      tokenHash: payload.tokenHash,
      orderId: payload.orderId ?? null,
      purchaseState: payload.purchaseState,
      purchaseStateLabel: payload.purchaseStateLabel,
      previousConsumptionState: payload.consumptionState,
    },
  };
}

export async function setManualEntitlement({
  deviceUserId,
  action,
  reason = "",
}: {
  deviceUserId?: string;
  action?: string;
  reason?: string;
}): Promise<Result<Record<string, unknown>>> {
  if (!deviceUserId) {
    return { status: 400, payload: { error: "deviceUserId is required" } };
  }

  if (action !== "grant" && action !== "revoke" && action !== "clear") {
    return {
      status: 400,
      payload: { error: "action must be grant, revoke, or clear" },
    };
  }

  await ensureDevice(deviceUserId);
  const status =
    action === "grant"
      ? "manual_granted"
      : action === "revoke"
        ? "manual_revoked"
        : "inactive";
  const { data: device, error } = await adminSupabase
    .from("challenge_clip_devices")
    .update({
      entitlement_status: status,
      active_purchase_id: null,
      last_verified_at: isoNow(),
    })
    .eq("id", deviceUserId)
    .select("*")
    .single();
  const updatedDevice = assertSupabaseRow(device, error, "Device");

  await audit({
    deviceId: deviceUserId,
    action: action === "clear" ? "manual_clear" : `manual_${action}`,
    reason,
  });

  if (action === "clear") {
    return {
      status: 200,
      payload: entitlementPayload(await recalculateDeviceEntitlement(deviceUserId)),
    };
  }

  return { status: 200, payload: entitlementPayload(updatedDevice) };
}

export async function searchAdmin({
  deviceUserId,
  orderId,
}: {
  deviceUserId?: string | null;
  orderId?: string | null;
}): Promise<Result<Record<string, unknown>>> {
  if (deviceUserId) {
    const device = await ensureDevice(deviceUserId);
    const recalculatedDevice = await recalculateDeviceEntitlement(device.id);
    const proUsageEvents = await getProUsageEventsForDevice(device.id);

    return {
      status: 200,
      payload: {
        entitlement: entitlementPayload(recalculatedDevice),
        proUsage: proUsageSummary(proUsageEvents),
        purchases: await getLinkedPurchases(device.id),
      },
    };
  }

  if (orderId) {
    const purchase = await selectPurchaseByOrderId(orderId);
    if (!purchase) {
      return { status: 404, payload: { error: "Purchase not found" } };
    }

    return {
      status: 200,
      payload: {
        purchase,
        proUsage: proUsageSummary(await getProUsageEventsForPurchase(purchase.id)),
        deviceIds: await connectedDeviceIds(purchase.id),
      },
    };
  }

  return {
    status: 400,
    payload: { error: "deviceUserId or orderId is required" },
  };
}

export function isAuthorized(req: NextRequest) {
  if (!ADMIN_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${ADMIN_SECRET}`;
}
