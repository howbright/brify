"use client";

import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import LeftPanel from "@/components/maps/LeftPanel";
import RightPanel from "@/components/maps/RightPanel";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import { loadingMindElixir } from "@/app/lib/g6/sampleData";
import { DEFAULT_THEME_NAME, MIND_THEME_BY_NAME } from "@/components/maps/themes";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";

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
  const t = useTranslations("FullscreenDialog");
  const { profileThemeName } = useMindThemePreference();


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
  const [rightTab, setRightTab] = useState<"notes" | "terms">("notes");
  const openDetails = () => {
    setRightTab("notes");
    setRightOpen((v) => !v);
    if (!rightOpen) {
      setLeftOpen(false);
    }
  };

  const openTerms = () => {
    if (rightOpen && rightTab === "terms") {
      setRightOpen(false);
      return;
    }
    setRightTab("terms");
    setRightOpen(true);
    setLeftOpen(false);
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
      aria-label={title ?? t("fallbackTitle")}
    >
      <div className="relative h-full w-full bg-white dark:bg-[#0b1220] overflow-hidden [--header-h:56px] max-[738px]:[--header-h:96px]">
        {/* ✅ (1) 상단 헤더 한 줄: 여기만 UI 배치 */}
        <header
          className="
            relative z-[20]
            w-full
            border-b border-neutral-200/80 bg-white/92 backdrop-blur
            dark:border-white/10 dark:bg-[#0b1220]/88
          "
          style={{ height: "var(--header-h)" }}
        >
          <div className="h-full px-4 flex flex-row items-center justify-between gap-3 max-[738px]:flex-col max-[738px]:items-start max-[738px]:gap-2 max-[738px]:py-2">
            {/* left: title */}
            <div className="min-w-0 flex items-center gap-2 w-full flex-1">
              <div className="text-sm font-semibold text-neutral-900 dark:text-white/90 truncate">
                {title ?? t("title")}
              </div>
            </div>

            {/* center: toolbar */}
            <div className="flex items-center gap-2 flex-nowrap shrink-0 min-w-[240px] max-[738px]:min-w-0 max-[738px]:flex-wrap max-[738px]:w-full max-[738px]:justify-center max-[738px]:pt-2 max-[738px]:pb-1 max-[738px]:border-t max-[738px]:border-neutral-200/70 dark:max-[738px]:border-white/10 sm:flex-nowrap">
              <ToolbarToggle
                pressed={editMode === "edit"}
                icon={editMode === "edit" ? "mdi:pencil" : "mdi:eye-outline"}
                label={editMode === "edit" ? t("mode.editing") : t("mode.view")}
                onClick={() =>
                  setEditMode((m) => (m === "view" ? "edit" : "view"))
                }
              />

              <ToolbarToggle
                pressed={leftOpen}
                icon="mdi:information-outline"
                label={t("tabs.info")}
                onClick={openMeta}
              />

              <ToolbarToggle
                pressed={rightOpen && rightTab === "notes"}
                icon="mdi:clipboard-text-outline"
                label={t("tabs.notes")}
                onClick={openDetails}
              />

              <ToolbarToggle
                pressed={rightOpen && rightTab === "terms"}
                icon="mdi:book-open-variant"
                label={t("tabs.terms")}
                onClick={openTerms}
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
                whitespace-nowrap
              "
            >
              <Icon icon="mdi:close" className="h-4 w-4" />
              {t("close")}
            </button>
          </div>
        </header>

        {/* ✅ (2) 헤더 아래: 맵 캔버스 영역 */}
        <div
          className="relative w-full"
          style={{ height: "calc(100% - var(--header-h))" }}
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
                editMode={editMode}
                theme={
                  profileThemeName && profileThemeName !== DEFAULT_THEME_NAME
                    ? MIND_THEME_BY_NAME[profileThemeName]
                    : undefined
                }
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
            <Icon icon="mdi:format-list-bulleted" className="h-4 w-4" />
            {t("goList")}
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
                ? t("modeBadge.edit")
                : t("modeBadge.view")}
            </span>
          </div>

          {mapError && (
            <div className="absolute left-4 top-3 z-[15]">
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
                <Icon icon="mdi:alert-circle-outline" className="h-3.5 w-3.5" />
                {t("status.fetchError")}
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
            initialTab={rightTab}
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
        text-xs font-semibold shadow-sm transition-colors
        ${
          pressed
            ? "border-blue-500 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)] dark:border-blue-300 dark:bg-blue-500/35 dark:text-blue-50 dark:shadow-[0_10px_24px_rgba(59,130,246,0.35)]"
            : "border-blue-200/70 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 dark:border-blue-300/50 dark:bg-blue-500/10 dark:text-blue-50/90 hover:dark:bg-blue-500/20"
        }
      `}
      aria-label={label}
      title={label}
    >
      <Icon icon={icon} className="h-4 w-4" />
      <span className="hidden sm:inline max-[738px]:inline">{label}</span>
    </button>
  );
}
