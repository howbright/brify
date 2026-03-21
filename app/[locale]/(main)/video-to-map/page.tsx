"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

import { MapDraft, MapJobStatus } from "./types";
import ScriptInputCard from "./ScriptInputCard";
// import ScriptHelpSection from "../video-to-map2/ScriptHelpSection";
import DraftMapCard from "./DraftMapCard";
import CreditConfirmModal from "./CreditConfirmModal";
import MetadataDialog from "./MetadataDialog";
import YoutubeScriptDialog from "./YoutubeScriptDialog";
import ResultReadyPanel from "./ResultReadyPanel";
import FullscreenDialog from "@/components/ui/FullscreenDialog";

import { createClient } from "@/utils/supabase/client";
import { useMapDraftStatusPolling } from "@/app/hooks/useMapDraftStatusPolling";

// ✅ 크레딧 정책 (1~2단계 + 초과는 거절)
const CREDIT_POLICY = {
  ONE_MAX_CHARS: 70_000,
  TWO_MAX_CHARS: 110_000,
} as const;

type BalanceResponse = {
  total: number;
  paid: number;
  free: number;
};

/**
 * ✅ 크레딧/제한 계산을 위한 정제 함수
 * - 타임스탬프(0:03, 12:34, 1:02:11) 제거
 * - [음악] [박수] 같은 태그 제거
 * - 공백/줄바꿈 정리
 */
function normalizeForBilling(raw: string) {
  let s = raw ?? "";

  // 1) 줄 시작 타임스탬프 제거
  //   - "0:03" 같은 타임스탬프만 있는 줄
  s = s.replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?\s*$/gm, "");
  //   - "0:03 내용..." 형태
  s = s.replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?\s+/gm, "");

  // 2) [음악], [박수] 등 대괄호 태그 제거 (한국어/영어 기본 패턴)
  s = s.replace(
    /\[(?:음악|박수|웃음|기도|찬양|간주|BGM|Music|SFX|Applause|Laugh).*?\]/gi,
    ""
  );

  // 3) 공백/줄바꿈 정리
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim();
}

// ✅ throw는 클릭/확정 시점에서만
function getRequiredCreditsUnsafe(text: string) {
  const cleaned = normalizeForBilling(text);
  const length = cleaned.length;

  if (!length) return 1;

  if (length > CREDIT_POLICY.TWO_MAX_CHARS) {
    throw new Error("INPUT_TOO_LARGE");
  }

  return length > CREDIT_POLICY.ONE_MAX_CHARS ? 2 : 1;
}

// ✅ 렌더용(절대 throw 안 함)
function getRequiredCreditsSafe(text: string) {
  const cleaned = normalizeForBilling(text);
  const length = cleaned.length;

  if (!length) return { credits: 1, length, tooLarge: false, cleaned };

  const tooLarge = length > CREDIT_POLICY.TWO_MAX_CHARS;
  const credits = length > CREDIT_POLICY.ONE_MAX_CHARS ? 2 : 1;

  return { credits, length, tooLarge, cleaned };
}

function detectSourceType(sourceUrl?: string) {
  if (!sourceUrl) return "manual" as const;
  const lowered = sourceUrl.toLowerCase();
  if (lowered.includes("youtube.com") || lowered.includes("youtu.be")) {
    return "youtube" as const;
  }
  return "website" as const;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function withCacheBuster(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("t", Date.now().toString());
    return u.toString();
  } catch {
    return url;
  }
}

const DRAFT_SELECT_FIELDS =
  "id,created_at,updated_at,title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged";

function coerceMapStatus(status?: string | null): MapJobStatus {
  if (status === "done" || status === "failed" || status === "processing") {
    return status;
  }
  // map_status가 "queued"/"idle" 등인 경우 처리 중으로 간주
  return "processing";
}

export default function VideoToMapPage() {
  const t = useTranslations("VideoToMapPage");
  const locale = useLocale();
  const router = useRouter();

  const [scriptText, setScriptText] = useState("");

  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusStep, setStatusStep] = useState(0);

  const [error, setError] = useState<string | null>(null);

  // ✅ 토스트(간단)
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const openToast = (message: string) => {
    setToast({ open: true, message });
    window.setTimeout(() => setToast({ open: false, message: "" }), 2600);
  };

  // ✅ “저장 후 카드” 리스트 (DB 대신)
  const [drafts, setDrafts] = useState<MapDraft[]>([]);

  // ✅ Draft 상태 폴링/머지 로직은 훅으로 분리
  useMapDraftStatusPolling(drafts, setDrafts, { refreshMs: 4000 });

  // const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [currentCredits, setCurrentCredits] = useState(0);

  // ✅ 렌더에서는 안전 계산만
  const creditInfo = useMemo(
    () => getRequiredCreditsSafe(scriptText),
    [scriptText]
  );
  const requiredCredits = creditInfo.credits;

  // ✅ 유튜브 모달 상태
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);

  // ✅ 유튜브 플로우 state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [youtubeSuccess, setYoutubeSuccess] = useState<string | null>(null);
  const [outputLang, setOutputLang] = useState("auto");

  const [youtubeMeta, setYoutubeMeta] = useState<{
    sourceUrl?: string;
    title?: string | null;
    channelName?: string | null;
    thumbnailUrl?: string | null;
  } | null>(null);

  // ✅ 입력 ↔ 결과 패널 교체
  const [viewMode, setViewMode] = useState<"input" | "result">("input");
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [createdMapId, setCreatedMapId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<MapDraft | null>(null);
  const [savingMetaId, setSavingMetaId] = useState<string | null>(null);
  const [openDraft, setOpenDraft] = useState<MapDraft | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(true);
  const [openMapData, setOpenMapData] = useState<any | null>(null);
  const [openMapLoading, setOpenMapLoading] = useState(false);
  const [openMapError, setOpenMapError] = useState<string | null>(null);
  const [pendingFocusDraftId, setPendingFocusDraftId] = useState<string | null>(null);
  const [highlightedDraftId, setHighlightedDraftId] = useState<string | null>(null);
  const draftsSectionRef = useRef<HTMLElement | null>(null);

  const statusMessages = useMemo(
    () => [
      t("status.reading"),
      t("status.splittingFlow"),
      t("status.arrangingStructure"),
      t("status.almostThere"),
    ],
    [t]
  );

  const buildTooLargeMessage = (current: number) =>
    [
      t("errors.tooLargeLine1"),
      t("errors.tooLargeLine2", {
        max: CREDIT_POLICY.TWO_MAX_CHARS.toLocaleString(),
      }),
      t("errors.tooLargeLine3", {
        current: current.toLocaleString(),
      }),
    ].join("\n");

  useEffect(() => {
    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/billing/balance", {
          method: "GET",
          cache: "no-store",
        });

        if (res.status === 401) return;
        if (!res.ok) return;

        const data: BalanceResponse = await res.json();
        if (!cancelled) setCurrentCredits(data.total ?? 0);
      } catch (err) {
        console.error("Error while loading balance:", err);
      }
    };

    fetchBalance();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showFullscreen || !openDraft?.id) return;

    let cancelled = false;
    const targetId = openDraft.id;

    setOpenMapData(null);
    setOpenMapError(null);
    setOpenMapLoading(true);

    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("maps")
          .select("mind_elixir,summary")
          .eq("id", targetId)
          .single();

        if (cancelled) return;
        if (error) throw error;

        const mindData = (data as { mind_elixir?: any })?.mind_elixir ?? null;
        if (!mindData) {
          throw new Error(t("errors.missingMindData"));
        }

        setOpenMapData(mindData);
        const fetchedSummary =
          (data as { summary?: string | null })?.summary ?? undefined;
        if (fetchedSummary) {
          setOpenDraft((prev) =>
            prev ? { ...prev, summary: fetchedSummary } : prev
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        setOpenMapError(e?.message ?? t("errors.openMapFailed"));
        setOpenMapData(null);
      } finally {
        if (!cancelled) setOpenMapLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showFullscreen, openDraft?.id, t]);

  useEffect(() => {
    if (!isProcessing) {
      setStatusStep(0);
      return;
    }

    const interval = window.setInterval(() => {
      setStatusStep((s) => (s + 1) % statusMessages.length);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [isProcessing, statusMessages.length]);

  useEffect(() => {
    if (!pendingFocusDraftId || showMetadataDialog) return;
    if (!drafts.some((draft) => draft.id === pendingFocusDraftId)) return;

    draftsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setHighlightedDraftId(pendingFocusDraftId);
    setPendingFocusDraftId(null);

    const timer = window.setTimeout(() => {
      setHighlightedDraftId((current) =>
        current === pendingFocusDraftId ? null : current
      );
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [drafts, pendingFocusDraftId, showMetadataDialog]);

  const showInputTooLargeUI = creditInfo.tooLarge;

  const handleClickGenerate = () => {
    setError(null);

    if (!scriptText.trim()) {
      setError(t("errors.emptyScript"));
      return;
    }

    // ✅ 초과 입력은 여기서 차단 + UI(에러/토스트)
    try {
      getRequiredCreditsUnsafe(scriptText);
    } catch (e: any) {
      if (e?.message === "INPUT_TOO_LARGE") {
        const msg = buildTooLargeMessage(creditInfo.length);
        setError(msg);
        openToast(msg);
        return;
      }
      setError(t("errors.processingFailed"));
      openToast(t("errors.processingFailed"));
      return;
    }

    setShowCreditDialog(true);
  };

  /**
   * ✅ URL로 스크립트 채우기 (모달에서 실행)
   */
  const handleFetchYoutube = async () => {
    setYoutubeError(null);
    setYoutubeSuccess(null);

    try {
      setIsFetchingYoutube(true);

      const u = youtubeUrl.trim();
      if (!u) throw new Error(t("errors.youtubeUrlRequired"));

      // ✅ 1) 브라우저 Supabase 세션에서 access_token 가져오기
      const supabase = createClient();
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        throw new Error(
          t("errors.sessionFailed", { message: sessionErr.message })
        );
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error(t("errors.loginRequired"));
      }

      // ✅ 2) Nest API 호출 (Bearer 토큰)
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error(t("errors.missingApiBase"));
      }

      const res = await fetch(`${base}/youtube-scripts/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          youtubeUrl: u,
          preferredLang: outputLang === "auto" ? undefined : outputLang,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          json?.message || json?.error || t("errors.youtubeFetchFailed");
        throw new Error(
          typeof msg === "string" ? msg : msg?.[0] || t("errors.requestFailed")
        );
      }

      // ✅ 3) previewText를 입력칸에 채우기
      const previewText = String(json?.previewText ?? "");
      if (!previewText.trim()) {
        throw new Error(
          t("errors.noTranscriptFound")
        );
      }

      setScriptText(previewText);
      setYoutubeMeta({
        sourceUrl: u,
        title: json?.title ?? "",
        channelName: json?.channelName ?? "",
        thumbnailUrl: json?.thumbnailUrl ?? "",
      });

      setError(null);

      setYoutubeSuccess(
        t("messages.youtubeFilled")
      );

      // ✅ 성공하면 0.6초 후 자동 닫기
      window.setTimeout(() => {
        setShowYoutubeDialog(false);
        setYoutubeSuccess(null);
      }, 600);
    } catch (e: any) {
      setYoutubeError(e?.message ?? t("errors.youtubeFetchFailed"));
    } finally {
      setIsFetchingYoutube(false);
    }
  };

  // ✅ 크레딧 확인 후 처리
  const handleConfirmUseCredits = async () => {
    // ✅ 모달 열린 사이 텍스트 변경 가능성 → 다시 계산/검증
    let creditsNow = 1;

    try {
      creditsNow = getRequiredCreditsUnsafe(scriptText);
    } catch (e: any) {
      if (e?.message === "INPUT_TOO_LARGE") {
        const msg = buildTooLargeMessage(creditInfo.length);
        setShowCreditDialog(false);
        setError(msg);
        openToast(msg);
        return;
      }
      setShowCreditDialog(false);
      setError(t("errors.processingFailed"));
      openToast(t("errors.processingFailed"));
      return;
    }

    if (currentCredits < creditsNow) {
      setShowCreditDialog(false);
      setError(t("errors.insufficientCredits"));
      return;
    }

    setShowCreditDialog(false);
    setError(null);
    setIsProcessing(true);

    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        throw new Error(
          t("errors.sessionFailed", { message: sessionErr.message })
        );
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error(t("errors.loginRequired"));
      }

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error(t("errors.missingApiBase"));
      }

      const sourceUrl = youtubeMeta?.sourceUrl || youtubeUrl || undefined;

      const res = await fetch(`${base}/maps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: t("labels.untitled"),
          extracted_text: scriptText,
          source_type: detectSourceType(sourceUrl),
          source_url: sourceUrl,
          schema_version: 1,
          output_language: outputLang || null,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.message || json?.error || t("errors.requestFailed");
        throw new Error(
          typeof msg === "string" ? msg : msg?.[0] || t("errors.requestFailed")
        );
      }

      const mapId = String(json?.id ?? "");
      if (!mapId) {
        throw new Error(t("errors.missingMapId"));
      }

      setDrafts((prev) => {
        if (prev.some((d) => d.id === mapId)) return prev;

        const sourceUrl = youtubeMeta?.sourceUrl || youtubeUrl || undefined;
        const normalized = normalizeForBilling(scriptText);
        const optimisticDraft: MapDraft = {
          id: mapId,
          createdAt: Date.now(),
          sourceUrl,
          sourceType: detectSourceType(sourceUrl),
          title: t("labels.untitled"),
          channelName: youtubeMeta?.channelName ?? undefined,
          thumbnailUrl: youtubeMeta?.thumbnailUrl ?? undefined,
          tags: [],
          description: "",
          sourceCharCount: normalized.length || undefined,
          status: "processing",
        };

        return [optimisticDraft, ...prev];
      });

      setCreatedMapId(mapId);
      setShowMetadataDialog(true);
      setViewMode("input");
      setScriptText("");
    } catch (e: any) {
      setIsProcessing(false);
      const msg = e?.message ?? t("errors.createFailed");
      setError(msg);
      openToast(msg);
    }
  };

  // ✅ 메타데이터 저장 → 카드 생성/업데이트
  const handleSaveMetadata = async (meta: {
    sourceUrl?: string;
    title: string;
    channelName?: string;
    thumbnailUrl?: string;
    tags: string[];
    description?: string;
  }) => {
    setError(null);

    try {
      const targetId = createdMapId ?? editingDraft?.id;
      if (!targetId) {
        throw new Error(t("errors.missingMapId"));
      }

      setSavingMetaId(targetId);

      const supabase = createClient();
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        throw new Error(
          t("errors.sessionFailed", { message: sessionErr.message })
        );
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error(t("errors.loginRequired"));
      }

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error(t("errors.missingApiBase"));
      }

      const res = await fetch(`${base}/maps/${targetId}/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: meta.title,
          description: meta.description,
          tags: meta.tags ?? [],
          thumbnail_url: meta.thumbnailUrl,
          channel_name: meta.channelName,
          source_type: detectSourceType(meta.sourceUrl),
          source_url: meta.sourceUrl,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.message || json?.error || t("errors.requestFailed");
        throw new Error(
          typeof msg === "string" ? msg : msg?.[0] || t("errors.requestFailed")
        );
      }

      let latestDraft: MapDraft | null = null;
      try {
        const { data, error } = await supabase
          .from("maps")
          .select(DRAFT_SELECT_FIELDS)
          .eq("id", targetId)
          .single();

        if (error) throw error;
        if (data) {
          latestDraft = {
            id: data.id,
            createdAt: new Date(data.created_at).getTime(),
            updatedAt: data.updated_at
              ? new Date(data.updated_at).getTime()
              : undefined,
            sourceUrl: data.source_url ?? undefined,
            sourceType: (data as { source_type?: string | null }).source_type
              ? ((data as { source_type?: string | null })
                  .source_type as MapDraft["sourceType"])
              : undefined,
            title: data.title ?? t("labels.untitled"),
            channelName: data.channel_name ?? undefined,
            thumbnailUrl: data.thumbnail_url
              ? withCacheBuster(data.thumbnail_url)
              : undefined,
            tags: Array.isArray(data.tags) ? data.tags : [],
            description: data.description ?? undefined,
            summary: (data as { summary?: string | null }).summary ?? undefined,
            status: coerceMapStatus(data.map_status),
            creditsCharged:
              typeof data.credits_charged === "number"
                ? data.credits_charged
                : undefined,
          };
        }
      } catch (e) {
        console.error("Failed to refresh draft from DB:", e);
      }

      setDrafts((prev) => {
        const id = targetId;
        if (!id) return prev;

        if (latestDraft) {
          const exists = prev.some((d) => d.id === id);
          if (exists) {
            return prev.map((d) => (d.id === id ? { ...d, ...latestDraft } : d));
          }
          return [latestDraft, ...prev];
        }

        const cacheBustedThumb = meta.thumbnailUrl
          ? withCacheBuster(meta.thumbnailUrl)
          : meta.thumbnailUrl;

        const draft: MapDraft = {
          id,
          createdAt: Date.now(),
          sourceUrl: meta.sourceUrl,
          title: meta.title || t("labels.untitled"),
          channelName: meta.channelName,
          thumbnailUrl: cacheBustedThumb,
          tags: meta.tags ?? [],
          description: meta.description,
          status: "processing",
        };

        const exists = prev.some((d) => d.id === id);
        if (exists) {
          return prev.map((d) => (d.id === id ? { ...d, ...draft } : d));
        }
        return [draft, ...prev];
      });

      setShowMetadataDialog(false);
      setYoutubeMeta(null);
      setIsProcessing(false);
      setPendingFocusDraftId(targetId);
      setCreatedMapId(null);
      setEditingDraft(null);
      setSavingMetaId(null);
    } catch (e: any) {
      setIsProcessing(false);
      const msg = e?.message ?? t("errors.createFailed");
      setError(msg);
      openToast(msg);
      setSavingMetaId(null);
    }
  };

  return (
    <main
      className="
        pt-16 pb-16 min-h-screen w-full relative
        bg-[#f4f6fb] dark:bg-[#020617]
        text-neutral-900 dark:text-neutral-50
      "
    >
      {/* 배경 유지 */}
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 h-72 -z-10
          bg-[radial-gradient(900px_380px_at_20%_0%,rgb(var(--hero-a)_/_0.16),transparent_65%),radial-gradient(900px_380px_at_80%_0%,rgb(var(--hero-b)_/_0.14),transparent_65%)]
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          [mask-image:linear-gradient(to_bottom,black,transparent_70%)]
          bg-[linear-gradient(to_right,rgb(var(--hero-grid)_/_0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--hero-grid)_/_0.035)_1px,transparent_1px)]
          bg-[size:26px_26px]
          opacity-60
          dark:opacity-30
        "
      />

      {/* ✅ 토스트 */}
      {toast.open && (
        <div className="fixed left-1/2 bottom-6 z-[100] -translate-x-1/2">
          <div className="max-w-[92vw] whitespace-pre-line rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-50">
            {toast.message}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-2 md:px-10 flex flex-col gap-3 relative">
        <header className="mt-7 space-y-2">
          <h1 className="text-2xl sm:text-2xl md:text-2xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-white">
            {t("title.prefix")}{" "}
            <span className="text-blue-700 dark:text-[rgb(var(--hero-b))]">
              {t("title.highlight")}
            </span>
          </h1>
        </header>

        <div
          className="
            grid gap-8 items-start
            transition-[grid-template-columns] duration-300 ease-out
            lg:grid-cols-[minmax(0,1fr)]
          "
        >
          {/* ✅ 입력영역 ↔ 결과패널 */}
          {viewMode === "input" ? (
            <ScriptInputCard
              scriptText={scriptText}
              setScriptText={setScriptText}
              error={error}
              isProcessing={isProcessing}
              currentCredits={currentCredits}
              requiredCredits={requiredCredits}
              onGenerate={handleClickGenerate}
              onOpenYoutubeDialog={() => {
                setYoutubeError(null);
                setYoutubeSuccess(null);
                setShowYoutubeDialog(true);
              }}
              outputLang={outputLang}
              setOutputLang={setOutputLang}
              disabled={showMetadataDialog}
              // ✅ 핵심: 한도 초과 UI 처리 props 내려주기
              isTooLarge={showInputTooLargeUI}
              billingLength={creditInfo.length}
              maxLength={CREDIT_POLICY.TWO_MAX_CHARS}
            />
          ) : (
            <ResultReadyPanel
              draft={drafts.find((d) => d.id === lastJobId) ?? null}
              onOpen={() => {
                if (!lastJobId) return;
                router.push(`/${locale}/maps/${lastJobId}`);
              }}
              onCreateNew={() => {
                setViewMode("input");
                setLastJobId(null);
              }}
            />
          )}

          {/* <div className="flex flex-col gap-4">
            <ScriptHelpSection
              isHelpOpen={isHelpOpen}
              onToggle={() => setIsHelpOpen((prev) => !prev)}
            />
          </div> */}
        </div>

        {drafts.length > 0 && (
          <section ref={draftsSectionRef} className="mt-2 space-y-3">
            <div className="flex items-end justify-between gap-2">
              <h2 className="text-base md:text-lg font-semibold">{t("labels.draftsTitle")}</h2>
            </div>

            <div className="grid gap-3">
              {drafts.map((d) => (
                <DraftMapCard
                  key={d.id}
                  draft={d}
                  highlighted={highlightedDraftId === d.id}
                  isSavingMetadata={savingMetaId === d.id}
                  onEditMetadata={(draft) => {
                    setCreatedMapId(draft.id);
                    setEditingDraft(draft);
                    setShowMetadataDialog(true);
                  }}
                  onOpen={(draft) => {
                    setOpenDraft(draft);
                    setShowFullscreen(true);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ✅ 유튜브 모달 */}
      <YoutubeScriptDialog
        open={showYoutubeDialog}
        onClose={() => {
          setShowYoutubeDialog(false);
          setYoutubeError(null);
          setYoutubeSuccess(null);
        }}
      />

      {showCreditDialog && (
        <CreditConfirmModal
          credits={requiredCredits}
          onCancel={() => setShowCreditDialog(false)}
          onConfirm={handleConfirmUseCredits}
        />
      )}

      {showMetadataDialog && (
        <MetadataDialog
          mapId={editingDraft?.id ?? createdMapId ?? undefined}
          initial={{
            sourceUrl: editingDraft?.sourceUrl ?? youtubeMeta?.sourceUrl ?? "",
            title: editingDraft?.title ?? youtubeMeta?.title ?? "",
            channelName:
              editingDraft?.channelName ?? youtubeMeta?.channelName ?? "",
            tags: editingDraft?.tags ?? [],
            description: editingDraft?.description ?? "",
            thumbnailUrl:
              editingDraft?.thumbnailUrl ?? youtubeMeta?.thumbnailUrl ?? "",
          }}
          onClose={() => {
            setShowMetadataDialog(false);
            setEditingDraft(null);
          }}
          onSave={handleSaveMetadata}
          isProcessing={isProcessing}
          processingTitle={t("processing.title")}
          processingMessage={statusMessages[statusStep]}
          processingBullets={[
            t("processing.bullet1"),
            t("processing.bullet2"),
            t("processing.bullet3"),
          ]}
        />
      )}

      <FullscreenDialog
        open={showFullscreen}
        title={openDraft?.title ?? t("labels.previewTitle")}
        draft={openDraft}
        mapData={openMapData}
        mapLoading={openMapLoading}
        mapError={openMapError}
        onClose={() => {
          setShowFullscreen(false);
          setOpenDraft(null);
        }}
      />
    </main>
  );
}
