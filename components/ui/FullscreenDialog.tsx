"use client";

import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useTheme } from "next-themes";
import LeftPanel from "@/components/maps/LeftPanel";
import RightPanel from "@/components/maps/RightPanel";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import { loadingMindElixir } from "@/app/lib/g6/sampleData";

const ClientMindElixir = dynamic(
  () => import("@/components/ClientMindElixir"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <span className="text-slate-500 dark:text-slate-400">
          마인드맵 로딩 중…
        </span>
      </div>
    ),
  }
);

// ✅ 헤더 높이(맵이 이 아래에서 시작)
const HEADER_H = 56;

export default function FullscreenDialog({
  open,
  title,
  onClose,
  onGoList,
  draft,
  mapData,
  mapLoading = false,
  mapError,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  onGoList?: () => void;
  draft?: MapDraft | null;
  mapData?: any | null;
  mapLoading?: boolean;
  mapError?: string | null;
}) {
  // ✅ UI state
  const [leftOpen, setLeftOpen] = useState(true); // metadata
  const [editMode, setEditMode] = useState<"view" | "edit">("view");
  const { resolvedTheme } = useTheme();

  type TermItem = { term: string; meaning: string };
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);

  const fetchTermsMock = async () => {
    if (termsLoading) return;
    setTermsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setTerms([
      // {
      //   term: "분산원장(Distributed Ledger)",
      //   meaning:
      //     "여러 참여자가 동일한 거래 기록을 공유·검증하는 데이터 구조로, 중앙 서버 없이도 신뢰를 유지하는 방식입니다.",
      // },
      // {
      //   term: "합의 알고리즘(Consensus)",
      //   meaning:
      //     "네트워크 참여자들이 거래의 유효성을 동일하게 확정하기 위한 절차입니다. 예: PoW, PoS.",
      // },
      // {
      //   term: "스마트 컨트랙트(Smart Contract)",
      //   meaning:
      //     "조건이 충족되면 자동으로 실행되는 계약 코드로, 중개자 없이 규칙을 강제합니다.",
      // },
      // {
      //   term: "디앱(DApp)",
      //   meaning:
      //     "중앙 서버가 아닌 블록체인 위에서 동작하는 애플리케이션으로 투명성과 검증가능성을 강조합니다.",
      // },
    ]);
    setTermsLoading(false);
  };


  // ✅ 좌측 패널(메타) 토글
  const openMeta = () => {
    setLeftOpen((v) => {
      const next = !v;
      if (next) setRightOpen(false);
      return next;
    });
  };

  // ✅ 우측 패널(맵 상세) 토글
  const [rightOpen, setRightOpen] = useState(false);
  const openDetails = () => {
    setRightOpen((v) => !v);
    if (!rightOpen) {
      setLeftOpen(false);
    }
  };

  if (!open || !draft) return null;

  const handleGoList = onGoList ?? onClose;
  const mapDraft = draft;

  return (
    <div
      className="
        fixed inset-0 z-[120]
        bg-black/70 backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "구조맵"}
    >
      <div className="relative h-full w-full bg-white dark:bg-[#0b1220] overflow-hidden">
        {/* ✅ (1) 상단 헤더 한 줄: 여기만 UI 배치 */}
        <header
          className="
            relative z-[20]
            w-full
            border-b border-neutral-200/80 bg-white/92 backdrop-blur
            dark:border-white/10 dark:bg-[#0b1220]/88
          "
          style={{ height: HEADER_H }}
        >
          <div className="h-full px-4 flex items-center justify-between gap-3">
            {/* left: title */}
            <div className="min-w-0 flex items-center gap-2">
              <div className="text-sm font-semibold text-neutral-900 dark:text-white/90 truncate">
                {title ?? "구조맵 미리보기"}
              </div>
            </div>

            {/* center: toolbar */}
            <div className="flex items-center gap-2">
              <ToolbarToggle
                pressed={editMode === "edit"}
                icon={editMode === "edit" ? "mdi:pencil" : "mdi:eye-outline"}
                label={editMode === "edit" ? "편집중" : "보기"}
                onClick={() =>
                  setEditMode((m) => (m === "view" ? "edit" : "view"))
                }
              />

              <ToolbarToggle
                pressed={leftOpen}
                icon="mdi:information-outline"
                label="정보"
                onClick={openMeta}
              />

              <ToolbarToggle
                pressed={rightOpen}
                icon="mdi:clipboard-text-outline"
                label="노트"
                onClick={openDetails}
              />
            </div>

            {/* right: close */}
            <button
              type="button"
              onClick={onClose}
              className="
                shrink-0
                inline-flex items-center gap-1.5
                rounded-2xl border border-neutral-200 bg-white px-3 py-1.5
                text-xs font-semibold text-neutral-700 hover:bg-neutral-50
                dark:border-white/12 dark:bg-white/[0.06]
                dark:text-white/85 dark:hover:bg-white/10
              "
            >
              <Icon icon="mdi:close" className="h-4 w-4" />
              닫기
            </button>
          </div>
        </header>

        {/* ✅ (2) 헤더 아래: 맵 캔버스 영역 */}
        <div
          className="relative w-full"
          style={{ height: `calc(100% - ${HEADER_H}px)` }}
        >
          {/* ✅ 작업영역 배경 (격자 + 은은한 톤) */}
          <div
            className="
              absolute inset-0
              bg-[#f6f7fb]
              dark:bg-[#070c16]
            "
          />

          {/* ✅ 라이트: 그리드 */}
          <div
            className="
              pointer-events-none absolute inset-0
              opacity-60
              [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)]
              [background-size:28px_28px]
              dark:opacity-30
              dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]
            "
          />

          {/* ✅ 살짝 vignette 느낌(집중감) */}
          <div
            className="
              pointer-events-none absolute inset-0
              [mask-image:radial-gradient(closest-side,black,transparent)]
              bg-[radial-gradient(900px_520px_at_50%_30%,rgba(59,130,246,0.10),transparent_62%)]
              dark:bg-[radial-gradient(900px_520px_at_50%_30%,rgba(56,189,248,0.10),transparent_62%)]
            "
          />

          {/* ✅ 실제 Elixir 캔버스 */}
          <div className="absolute inset-0 p-0">
            {/* 
              👇 이 wrapper가 배경을 잡아주니까,
              Elixir 자체 배경이 하얗더라도 "작업영역" 느낌이 살아남.
            */}
            <div className="h-full w-full rounded-2xl border border-neutral-200/70 bg-white/65 backdrop-blur-sm shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <ClientMindElixir
                mode={resolvedTheme === "dark" ? "dark" : "light"}
                dragButton={2}
                data={mapData ?? undefined}
                loading={mapLoading}
                placeholderData={loadingMindElixir}
              />
            </div>
          </div>

          {/* ✅ 구석: 내 맵 (네비게이션이라 툴바 아님) */}
          <button
            type="button"
            onClick={handleGoList}
            className="
              absolute left-4 bottom-4 z-[15]
              inline-flex items-center gap-1.5
              rounded-2xl border border-neutral-200 bg-white/90 px-3 py-2
              text-xs font-semibold text-neutral-700 shadow-lg backdrop-blur hover:bg-white
              dark:border-white/10 dark:bg-[#0b1220]/75 dark:text-white/80 dark:hover:bg-[#0b1220]/90
            "
            title="내 맵 리스트로"
          >
            <Icon icon="mdi:format-list-bulleted" className="h-4 w-4" />내 맵
          </button>

          {/* ✅ 편집모드 힌트 (헤더 아래 우측 상단 근처로 이동) */}
          <div className="absolute right-4 top-3 z-[15]">
            <span
              className="
                inline-flex items-center gap-1 rounded-full
                border border-neutral-200 bg-white/80 px-2.5 py-1 text-[11px] text-neutral-600
                dark:border-white/10 dark:bg-[#0b1220]/60 dark:text-white/65
              "
            >
              <Icon icon="mdi:gesture-tap" className="h-3.5 w-3.5" />
              {editMode === "edit"
                ? "편집모드: 노드 수정/추가 가능"
                : "보기모드: 흐름을 집중해서 확인"}
            </span>
          </div>

          {mapError && (
            <div className="absolute left-4 top-3 z-[15]">
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
                <Icon icon="mdi:alert-circle-outline" className="h-3.5 w-3.5" />
                구조맵을 불러오지 못했어요
              </span>
            </div>
          )}

          {/* ✅ 좌측: 메타데이터 패널 */}
          <LeftPanel
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
            map={mapDraft}
          />

          {/* ✅ 우측: 구조맵 상세 패널 */}
          <RightPanel
            open={rightOpen}
            onClose={() => setRightOpen(false)}
            mapId={mapDraft.id}
            terms={terms}
            termsLoading={termsLoading}
            onFetchTerms={fetchTermsMock}
          />

          {/* ✅ 패널 닫기 버튼 제거 */}
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI Parts ---------------- */

function ToolbarToggle({
  pressed,
  icon,
  label,
  onClick,
}: {
  pressed: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5
        rounded-xl border px-3 py-1.5
        text-xs font-semibold
        ${
          pressed
            ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/12 dark:text-blue-200"
            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
        }
      `}
      aria-label={label}
      title={label}
    >
      <Icon icon={icon} className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
