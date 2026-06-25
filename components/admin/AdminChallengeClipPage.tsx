"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SearchMode = "orderId" | "deviceUserId";
type ManualAction = "grant" | "revoke" | "clear";

type RequestInitWithoutBody = Omit<RequestInit, "body"> & {
  body?: Record<string, unknown>;
};

function adminHomeHref(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] || "ko";
  return `/${locale}/admin`;
}

async function requestJson(url: string, init: RequestInitWithoutBody = {}) {
  const headers = new Headers(init.headers);
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | Record<string, unknown>
    | null;

  if (!response.ok) {
    const errorText =
      payload && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : payload && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : `Request failed (${response.status})`;

    throw new Error(errorText);
  }

  return payload;
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  if (!value) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
      <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold text-slate-300">
        {title}
      </div>
      <pre className="max-h-96 overflow-auto p-4 text-xs leading-5 text-slate-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function ProUsageNotice({ value }: { value: unknown }) {
  if (!value || typeof value !== "object") return null;

  const proUsage = (value as { proUsage?: unknown }).proUsage;
  if (!proUsage || typeof proUsage !== "object") return null;

  const {
    hasUsedProBenefit,
    eventCount,
    firstUsedAt,
    latestUsedAt,
  } = proUsage as {
    hasUsedProBenefit?: boolean;
    eventCount?: number;
    firstUsedAt?: string | null;
    latestUsedAt?: string | null;
  };

  if (!hasUsedProBenefit) {
    return (
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
        아직 서버에 기록된 Pro 혜택 사용 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
      <div className="font-extrabold">Pro 혜택 사용됨 · 환불 제한 검토 대상</div>
      <div className="mt-1">
        사용 이벤트 {eventCount ?? 0}건
        {firstUsedAt ? ` · 최초 ${firstUsedAt}` : ""}
        {latestUsedAt ? ` · 최근 ${latestUsedAt}` : ""}
      </div>
    </div>
  );
}

export default function AdminChallengeClipPage() {
  const pathname = usePathname();
  const [orderId, setOrderId] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundResult, setRefundResult] = useState<unknown>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<unknown>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>("orderId");
  const [searchText, setSearchText] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<unknown>(null);
  const [manualDeviceId, setManualDeviceId] = useState("");
  const [manualAction, setManualAction] = useState<ManualAction>("revoke");
  const [manualReason, setManualReason] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState<unknown>(null);
  const [tokenProductId, setTokenProductId] = useState("pro_lifetime");
  const [purchaseToken, setPurchaseToken] = useState("");
  const [tokenInspectLoading, setTokenInspectLoading] = useState(false);
  const [tokenInspectResult, setTokenInspectResult] = useState<unknown>(null);
  const [tokenConsumeLoading, setTokenConsumeLoading] = useState(false);
  const [tokenConsumeResult, setTokenConsumeResult] = useState<unknown>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRefundRevoke(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setRefundResult(null);

    const trimmedOrderId = orderId.trim();
    if (!trimmedOrderId) {
      setErrorMessage("GPA 주문 번호를 입력해 주세요.");
      return;
    }

    const confirmed = window.confirm(
      `${trimmedOrderId} 주문을 Google Play에 refund + revoke 요청할까요?`
    );
    if (!confirmed) return;

    setRefundLoading(true);
    try {
      setRefundResult(
        await requestJson("/api/admin/challenge-clip/refund-revoke", {
          method: "POST",
          body: { orderId: trimmedOrderId, revoke: true },
        })
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "환불 처리에 실패했어요.");
    } finally {
      setRefundLoading(false);
    }
  }

  async function handleSyncVoided() {
    setErrorMessage("");
    setSyncResult(null);
    setSyncLoading(true);
    try {
      setSyncResult(
        await requestJson("/api/admin/challenge-clip/sync-voided", {
          method: "POST",
        })
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "voided sync에 실패했어요.");
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSearchResult(null);

    const query = searchText.trim();
    if (!query) {
      setErrorMessage("검색할 주문 번호나 deviceUserId를 입력해 주세요.");
      return;
    }

    const params = new URLSearchParams({ [searchMode]: query });
    setSearchLoading(true);
    try {
      setSearchResult(
        await requestJson(`/api/admin/challenge-clip/search?${params.toString()}`)
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "검색에 실패했어요.");
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleManualEntitlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setManualResult(null);

    const deviceUserId = manualDeviceId.trim();
    if (!deviceUserId) {
      setErrorMessage("deviceUserId를 입력해 주세요.");
      return;
    }

    if (manualAction !== "grant") {
      const confirmed = window.confirm(
        `${deviceUserId}의 Pro 권한을 ${manualAction} 처리할까요?`
      );
      if (!confirmed) return;
    }

    setManualLoading(true);
    try {
      setManualResult(
        await requestJson("/api/admin/challenge-clip/manual-entitlement", {
          method: "POST",
          body: {
            deviceUserId,
            action: manualAction,
            reason: manualReason.trim(),
          },
        })
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "수동 권한 처리에 실패했어요.");
    } finally {
      setManualLoading(false);
    }
  }

  async function handleInspectToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setTokenInspectResult(null);

    const productId = tokenProductId.trim();
    const token = purchaseToken.trim();

    if (!productId) {
      setErrorMessage("productId를 입력해 주세요.");
      return;
    }

    if (!token) {
      setErrorMessage("purchase token을 입력해 주세요.");
      return;
    }

    setTokenInspectLoading(true);
    try {
      setTokenInspectResult(
        await requestJson("/api/admin/challenge-clip/inspect-token", {
          method: "POST",
          body: {
            productId,
            purchaseToken: token,
          },
        })
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "토큰 조회에 실패했어요.");
    } finally {
      setTokenInspectLoading(false);
    }
  }

  async function handleConsumeCanceledToken() {
    setErrorMessage("");
    setTokenConsumeResult(null);

    const productId = tokenProductId.trim();
    const token = purchaseToken.trim();

    if (!productId) {
      setErrorMessage("productId를 입력해 주세요.");
      return;
    }

    if (!token) {
      setErrorMessage("purchase token을 입력해 주세요.");
      return;
    }

    const confirmed = window.confirm(
      "이 작업은 취소된 purchase token을 consume 처리합니다. 정상 구매 토큰에는 사용하면 안 됩니다. 계속할까요?"
    );
    if (!confirmed) return;

    setTokenConsumeLoading(true);
    try {
      setTokenConsumeResult(
        await requestJson("/api/admin/challenge-clip/consume-token", {
          method: "POST",
          body: {
            productId,
            purchaseToken: token,
          },
        })
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "토큰 consume에 실패했어요.");
    } finally {
      setTokenConsumeLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href={adminHomeHref(pathname)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        어드민 홈
      </Link>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            ChallengeClip 운영
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950">
            결제 권한 관리
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Google Play 주문 revoke, voided purchases 동기화, deviceUserId 권한 상태 확인을
            이 화면에서 처리해요. 비밀키는 브라우저로 내려가지 않고 서버 안에서만 사용됩니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncVoided}
          disabled={syncLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {syncLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Voided sync 실행
        </button>
      </div>

      <StatusMessage message={errorMessage} />

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <form
          onSubmit={handleRefundRevoke}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
                주문 refund + revoke
              </h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Google Play 주문 번호로 환불과 권한 회수를 함께 요청합니다.
              </p>
            </div>
            <RotateCcw className="h-5 w-5 text-slate-400" />
          </div>

          <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Order ID
          </label>
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="GPA.3339-5868-0020-44223"
            className="mt-2 h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />

          <button
            type="submit"
            disabled={refundLoading}
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refundLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Refund + revoke
          </button>

          <JsonPanel title="Refund result" value={refundResult} />
        </form>

        <form
          onSubmit={handleSearch}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
                구매/권한 조회
              </h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                주문 번호 또는 앱의 deviceUserId로 현재 서버 상태를 확인합니다.
              </p>
            </div>
            <Search className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-bold text-slate-600">
            {(["orderId", "deviceUserId"] as SearchMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSearchMode(mode)}
                className={cn(
                  "h-9 rounded-xl transition",
                  searchMode === mode && "bg-white text-slate-950 shadow-sm"
                )}
              >
                {mode === "orderId" ? "Order ID" : "Device ID"}
              </button>
            ))}
          </div>

          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={searchMode === "orderId" ? "GPA...." : "deviceUserId UUID"}
            className="mt-3 h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />

          <button
            type="submit"
            disabled={searchLoading}
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searchLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            조회
          </button>

          <ProUsageNotice value={searchResult} />
          <JsonPanel title="Search result" value={searchResult} />
        </form>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <form
          onSubmit={handleInspectToken}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
                Purchase token 조회
              </h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Google Play가 이 토큰을 purchased, canceled, pending 중 무엇으로 보는지 직접 확인합니다.
              </p>
            </div>
            <KeyRound className="h-5 w-5 text-slate-400" />
          </div>

          <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Product ID
          </label>
          <input
            value={tokenProductId}
            onChange={(event) => setTokenProductId(event.target.value)}
            placeholder="pro_lifetime"
            className="mt-2 h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />

          <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Purchase token
          </label>
          <textarea
            value={purchaseToken}
            onChange={(event) => setPurchaseToken(event.target.value)}
            placeholder="Google Play purchase token"
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={tokenInspectLoading || tokenConsumeLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {tokenInspectLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              토큰 조회
            </button>
            <button
              type="button"
              onClick={handleConsumeCanceledToken}
              disabled={tokenInspectLoading || tokenConsumeLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {tokenConsumeLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              취소된 토큰 consume
            </button>
          </div>

          <p className="mt-3 text-xs leading-5 text-amber-700">
            consume은 purchaseState가 canceled인 테스트/문제 토큰 정리용입니다. 서버가 정상 구매 토큰은 거부합니다.
          </p>

          <JsonPanel title="Purchase token result" value={tokenInspectResult} />
          <JsonPanel title="Consume token result" value={tokenConsumeResult} />
        </form>

        <form
          onSubmit={handleManualEntitlement}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
            수동 Pro 권한 처리
          </h2>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            고객 지원이 필요한 예외 상황에서만 deviceUserId 기준으로 권한을 조정합니다.
          </p>

          <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Device user ID
          </label>
          <input
            value={manualDeviceId}
            onChange={(event) => setManualDeviceId(event.target.value)}
            placeholder="앱 deviceUserId UUID"
            className="mt-2 h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />

          <div className="mt-4 grid grid-cols-3 rounded-2xl bg-slate-100 p-1 text-sm font-bold text-slate-600">
            {(["grant", "revoke", "clear"] as ManualAction[]).map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => setManualAction(action)}
                className={cn(
                  "h-9 rounded-xl capitalize transition",
                  manualAction === action && "bg-white text-slate-950 shadow-sm"
                )}
              >
                {action}
              </button>
            ))}
          </div>

          <textarea
            value={manualReason}
            onChange={(event) => setManualReason(event.target.value)}
            placeholder="처리 사유"
            rows={3}
            className="mt-3 w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />

          <button
            type="submit"
            disabled={manualLoading}
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {manualLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            권한 적용
          </button>

          <JsonPanel title="Manual entitlement result" value={manualResult} />
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
            최근 sync 결과
          </h2>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            버튼으로 실행한 voided purchases sync 결과가 여기에 표시됩니다.
          </p>
          <JsonPanel title="Voided sync result" value={syncResult} />
          {!syncResult && (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-5 text-sm leading-6 text-slate-500">
              아직 실행 결과가 없습니다.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
