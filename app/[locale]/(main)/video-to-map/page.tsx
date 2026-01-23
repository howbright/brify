"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MapDraft } from "./types";
import ScriptInputCard from "./ScriptInputCard";
import ScriptHelpSection from "../video-to-map2/ScriptHelpSection";
import ProcessingStatusCard from "./ProcessingStatusCard";
import DraftMapCard from "./DraftMapCard";
import CreditConfirmModal from "./CreditConfirmModal";
import MetadataDialog from "./MetadataDialog";
import YoutubeScriptDialog from "./YoutubeScriptDialog";
import { createClient } from "@/utils/supabase/client"; // ✅ 너 경로에 맞게!

const LONG_SCRIPT_THRESHOLD = 6000;
const MOCK_CURRENT_CREDITS = 42;

function getRequiredCredits(text: string) {
  const length = text.trim().length;
  if (!length) return 1;
  return length > LONG_SCRIPT_THRESHOLD ? 2 : 1;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function VideoToMapPage() {
  const t = useTranslations("VideoToMapPage");

  const [scriptText, setScriptText] = useState("");

  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusStep, setStatusStep] = useState(0);

  const [error, setError] = useState<string | null>(null);

  // ✅ “저장 후 카드” 리스트 (DB 대신)
  const [drafts, setDrafts] = useState<MapDraft[]>([]);

  // ✅ 지금 클릭해서 진행 중인 작업을 연결하기 위한 임시 job context
  const pendingJobIdRef = useRef<string | null>(null);
  const pendingScriptRef = useRef<string>("");

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const currentCredits = MOCK_CURRENT_CREDITS;
  const requiredCredits = getRequiredCredits(scriptText);

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

  const statusMessages = useMemo(
    () => [
      t("status.reading"),
      t("status.splittingFlow"),
      t("status.extractingKeywords"),
      t("status.arrangingStructure"),
      t("status.almostThere"),
    ],
    [t]
  );

  useEffect(() => {
    if (!isProcessing) {
      setStatusStep(0);
      return;
    }

    const interval = setInterval(() => {
      setStatusStep((s) => (s + 1) % statusMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isProcessing, statusMessages.length]);

  const handleClickGenerate = () => {
    setError(null);

    if (!scriptText.trim()) {
      setError(t("errors.emptyScript"));
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
      if (!u) throw new Error("유튜브 URL을 입력해 주세요.");

      // ✅ 1) 브라우저 Supabase 세션에서 access_token 가져오기
      const supabase = createClient();
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        throw new Error("세션을 가져오지 못했습니다: " + sessionErr.message);
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      // ✅ 2) Nest API 호출 (Bearer 토큰)
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error("환경변수 NEXT_PUBLIC_API_BASE_URL이 없습니다.");
      }
      console.log(base);

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
          json?.message || json?.error || "스크립트를 가져오지 못했습니다.";
        throw new Error(
          typeof msg === "string" ? msg : msg?.[0] || "요청 실패"
        );
      }

      // ✅ 3) previewText를 입력칸에 채우기
      const previewText = String(json?.previewText ?? "");
      if (!previewText.trim()) {
        throw new Error(
          "자막/스크립트를 찾지 못했습니다. (영상에 자막이 없을 수 있어요)"
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
        "스크립트를 가져와 입력칸에 채워 드렸습니다. 이제 바로 생성하실 수 있습니다."
      );

      // ✅ 성공하면 0.6초 후 자동 닫기
      setTimeout(() => {
        setShowYoutubeDialog(false);
        setYoutubeSuccess(null);
      }, 600);
    } catch (e: any) {
      setYoutubeError(e?.message ?? "스크립트를 가져오지 못했습니다.");
    } finally {
      setIsFetchingYoutube(false);
    }
  };

  // ✅ (2) 크레딧 확인 후: “작업 시작(모킹)” + “메타데이터 팝업 열기”
  const handleConfirmUseCredits = async () => {
    if (currentCredits < requiredCredits) {
      setShowCreditDialog(false);
      setError(t("errors.insufficientCredits"));
      return;
    }

    setShowCreditDialog(false);
    setError(null);

    const jobId = genId();
    pendingJobIdRef.current = jobId;
    pendingScriptRef.current = scriptText;

    setIsProcessing(true);
    setShowMetadataDialog(true);

    setTimeout(() => {
      setDrafts((prev) => {
        const idx = prev.findIndex((d) => d.id === jobId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            status: "done",
            result: { ok: true, mock: true, nodes: 12, edges: 14 },
          };
          return next;
        }
        return prev;
      });

      setIsProcessing(false);
    }, 9000);
  };

  // ✅ (3) 메타데이터 저장 → 카드 생성/업데이트
  const handleSaveMetadata = (meta: {
    sourceUrl?: string;
    title: string;
    channelName?: string;
    thumbnailUrl?: string;
    tags: string[];
    description?: string;
  }) => {
    const jobId = pendingJobIdRef.current ?? genId();

    setDrafts((prev) => {
      const exists = prev.some((d) => d.id === jobId);
      const status = isProcessing ? "processing" : "done";

      const draft: MapDraft = {
        id: jobId,
        createdAt: Date.now(),
        sourceUrl: meta.sourceUrl,
        title: meta.title || "Untitled",
        channelName: meta.channelName,
        thumbnailUrl: meta.thumbnailUrl,
        tags: meta.tags ?? [],
        description: meta.description,
        status,
        result: status === "done" ? { ok: true, mock: true } : undefined,
      };

      if (exists) {
        return prev.map((d) => (d.id === jobId ? { ...d, ...draft } : d));
      }
      return [draft, ...prev];
    });

    setShowMetadataDialog(false);
    pendingJobIdRef.current = null;
    pendingScriptRef.current = "";

    setYoutubeMeta(null);
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

      <div className="max-w-6xl mx-auto px-2 md:px-10 flex flex-col gap-3 relative">
        <header className="mt-7">
          <h1 className="text-2xl sm:text-2xl md:text-2xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-white">
            {t("title.prefix")}{" "}
            <span className="text-blue-700 dark:text-[rgb(var(--hero-b))]">
              {t("title.highlight")}
            </span>
          </h1>
        </header>

        <div
          className={`
            grid gap-8 items-start
            transition-[grid-template-columns] duration-300 ease-out
            ${
              isHelpOpen
                ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
                : "lg:grid-cols-[minmax(0,1.8fr)_minmax(0,0.4fr)]"
            }
          `}
        >
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
          />

          <div className="flex flex-col gap-4">
            <ScriptHelpSection
              isHelpOpen={isHelpOpen}
              onToggle={() => setIsHelpOpen((prev) => !prev)}
            />
          </div>
        </div>

        {drafts.length > 0 && (
          <section className="mt-2 space-y-3">
            <div className="flex items-end justify-between gap-2">
              <h2 className="text-base md:text-lg font-semibold">
                만든 구조맵
              </h2>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                프로토타입: DB 없이 임시 저장
              </span>
            </div>

            <div className="grid gap-3">
              {drafts.map((d) => (
                <DraftMapCard key={d.id} draft={d} />
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
        youtubeUrl={youtubeUrl}
        setYoutubeUrl={setYoutubeUrl}
        onFetch={handleFetchYoutube}
        isFetching={isFetchingYoutube}
        error={youtubeError}
        success={youtubeSuccess}
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
          initial={{
            sourceUrl: youtubeMeta?.sourceUrl ?? "",
            title: youtubeMeta?.title ?? "",
            channelName: youtubeMeta?.channelName ?? "",
            tags: [],
            description: "",
            thumbnailUrl: youtubeMeta?.thumbnailUrl ?? "",
          }}
          onClose={() => setShowMetadataDialog(false)}
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
    </main>
  );
}
