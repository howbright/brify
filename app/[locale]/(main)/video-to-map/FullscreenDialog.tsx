"use client";

import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { ReactNode, useMemo, useState } from "react";

import RightPanel, { RightPanelTab } from "@/components/RightPanel";

const ClientMindElixir = dynamic(() => import("@/components/ClientMindElixir"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
      <span className="text-slate-500 dark:text-slate-400">
        마인드맵 로딩 중…
      </span>
    </div>
  ),
});

type FakeMapMeta = {
  title: string;
  sourceType: "youtube" | "website" | "manual";
  sourceUrl?: string;
  channelName?: string;
  tags: string[];
  createdAt: number;
  createdAtLabel: string;
  description?: string;
};

type TermItem = { term: string; meaning: string };
type NoteItem = { id: string; text: string; createdAt: number };

export default function FullscreenDialog({
  open,
  title,
  onClose,
  onGoList,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  onGoList?: () => void;
}) {
  if (!open) return null;

  // ✅ UI state
  const [leftOpen, setLeftOpen] = useState(false); // metadata
  const [rightOpen, setRightOpen] = useState(false); // right panel (notes/terms)
  const [rightTab, setRightTab] = useState<RightPanelTab>("notes");

  const [editMode, setEditMode] = useState<"view" | "edit">("view");
  const [termsLoading, setTermsLoading] = useState(false);

  // ✅ 가데이터
  const meta: FakeMapMeta = useMemo(
    () => ({
      title: "예배 회복을 위한 7가지 흐름",
      sourceType: "youtube",
      sourceUrl: "https://youtu.be/xxxxx",
      channelName: "vision328",
      tags: ["설교", "예배", "회복", "구조맵"],
      createdAt: 1769999460000,
      createdAtLabel: "2026. 2. 2. 오전 11:31:00",
      description:
        "가데이터입니다. 이 영역은 접혀있고, 필요할 때만 펼쳐서 보는 정보예요.",
    }),
    []
  );
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/f7934683-fa51-45b4-acf6-ebcb17f6899f", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "hydration-2",
      hypothesisId: "H1",
      location: "FullscreenDialog.tsx:meta",
      message: "meta createdAt computed",
      data: { createdAt: meta.createdAt, open },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const [terms, setTerms] = useState<TermItem[]>(
    useMemo(
      () => [
        { term: "칭의", meaning: "하나님이 죄인을 의롭다 하시는 선언." },
        { term: "성화", meaning: "구원받은 사람이 거룩해져 가는 과정." },
        { term: "언약", meaning: "하나님과 사람 사이의 약속, 관계의 틀." },
      ],
      []
    )
  );

  const [notes, setNotes] = useState<NoteItem[]>(
    useMemo(
      () => [
        {
          id: "n1",
          text: "이 부분은 ‘칭의’ 정의를 더 쉬운 말로 바꾸자.",
          createdAt: 1769999460000 - 1000 * 60 * 8,
        },
        {
          id: "n2",
          text: "노드 3개는 순서가 바뀌면 더 자연스럽다.",
          createdAt: 1769999460000 - 1000 * 60 * 3,
        },
      ],
      []
    )
  );

  const runFetchTerms = async () => {
    // ✅ 여기 나중에 API 연결
    setTermsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 650));
      setTerms((prev) => prev); // placeholder
    } finally {
      setTermsLoading(false);
      // 용어 기능은 실행 시 우측 패널 + 용어탭으로 자연스럽게
      setRightOpen(true);
      setRightTab("terms");
      setLeftOpen(false);
    }
  };

  // ✅ 좌측 패널(메타) 토글
  const openMeta = () => {
    setLeftOpen((v) => !v);
    if (!leftOpen) {
      setRightOpen(false);
    }
  };

  // ✅ 노트 버튼: 우측 패널 열고 notes 탭
  const openNotes = () => {
    setRightTab("notes");
    setRightOpen(true);
    setLeftOpen(false);
  };

  // ✅ 용어 버튼: 우측 패널 열고 terms 탭 + fetch
  const openTerms = () => {
    setRightTab("terms");
    setRightOpen(true);
    setLeftOpen(false);
    runFetchTerms();
  };

  const handleGoList = onGoList ?? onClose;

  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/f7934683-fa51-45b4-acf6-ebcb17f6899f", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "hydration-2",
      hypothesisId: "H3",
      location: "FullscreenDialog.tsx:render",
      message: "render state",
      data: { open, leftOpen, rightOpen, rightTab, editMode },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
      <div
        className="
          relative h-full w-full
          bg-white
          dark:bg-[#0b1220]
        "
      >
        <div className="absolute left-5 top-4 z-[12] text-sm font-semibold text-neutral-800 dark:text-white/85">
          {title ?? "구조맵 미리보기"}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="
            absolute right-4 top-4 z-[12]
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

        <div className="relative h-full w-full overflow-hidden">
          {/* ✅ 캔버스 */}
          <div className="absolute inset-0">
            <ClientMindElixir mode="light" dragButton={2} />
          </div>

          {/* ✅ 구석: 내 맵 (네비게이션이라 툴바 아님) */}
          <button
            type="button"
            onClick={handleGoList}
            className="
              absolute left-4 bottom-4 z-[12]
              inline-flex items-center gap-1.5
              rounded-2xl border border-neutral-200 bg-white/90 px-3 py-2
              text-xs font-semibold text-neutral-700 shadow-lg backdrop-blur hover:bg-white
              dark:border-white/10 dark:bg-[#0b1220]/75 dark:text-white/80 dark:hover:bg-[#0b1220]/90
            "
            title="내 맵 리스트로"
          >
            <Icon icon="mdi:format-list-bulleted" className="h-4 w-4" />
            내 맵
          </button>

          {/* ✅ 상단 floating toolbar */}
          <div className="absolute left-1/2 top-4 z-[10] -translate-x-1/2">
            <div
              className="
                flex items-center gap-2
                rounded-2xl border border-neutral-200 bg-white/90 px-2 py-2 shadow-lg backdrop-blur
                dark:border-white/10 dark:bg-[#0b1220]/80
              "
            >
              {/* view/edit */}
              <ToolbarToggle
                pressed={editMode === "edit"}
                icon={editMode === "edit" ? "mdi:pencil" : "mdi:eye-outline"}
                label={editMode === "edit" ? "편집중" : "보기"}
                onClick={() =>
                  setEditMode((m) => (m === "view" ? "edit" : "view"))
                }
              />

              {/* metadata */}
              <ToolbarToggle
                pressed={leftOpen}
                icon="mdi:information-outline"
                label="정보"
                onClick={openMeta}
              />

              {/* notes */}
              <ToolbarToggle
                pressed={rightOpen && rightTab === "notes"}
                icon="mdi:notebook-outline"
                label="노트"
                onClick={openNotes}
              />

              {/* terms (가끔 기능) */}
              <ToolbarButton
                icon={termsLoading ? "mdi:loading" : "mdi:book-open-variant"}
                label="용어"
                onClick={openTerms}
                spin={termsLoading}
              />
            </div>

            {/* ✅ 편집모드 힌트 */}
            <div className="mt-2 text-center">
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
          </div>

          {/* ✅ 좌측: 메타데이터 패널 */}
          <SidePanel
            side="left"
            open={leftOpen}
            title="메타데이터"
            onClose={() => setLeftOpen(false)}
          >
            <MetaBlock meta={meta} />
          </SidePanel>

          {/* ✅ 우측: RightPanel (노트/용어 탭) */}
          <RightPanel
            open={rightOpen}
            initialTab={rightTab}
            onClose={() => setRightOpen(false)}
            notes={notes}
            setNotes={setNotes}
            terms={terms}
            termsLoading={termsLoading}
            onFetchTerms={runFetchTerms}
          />

          {/* ✅ 패널 닫기 */}
          {(leftOpen || rightOpen) && (
            <button
              type="button"
              onClick={() => {
                setLeftOpen(false);
                setRightOpen(false);
              }}
              className="
                absolute bottom-4 right-4 z-[10]
                rounded-2xl border border-neutral-200 bg-white/90 px-3 py-2
                text-xs font-semibold text-neutral-700 shadow-lg backdrop-blur hover:bg-white
                dark:border-white/10 dark:bg-[#0b1220]/75 dark:text-white/80 dark:hover:bg-[#0b1220]/90
              "
            >
              패널 닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI Parts ---------------- */

function ToolbarButton({
  icon,
  label,
  onClick,
  spin,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  spin?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        inline-flex items-center gap-1.5
        rounded-xl border border-neutral-200 bg-white px-3 py-1.5
        text-xs font-semibold text-neutral-700 hover:bg-neutral-50
        dark:border-white/12 dark:bg-white/[0.06]
        dark:text-white/85 dark:hover:bg-white/10
      "
      aria-label={label}
      title={label}
    >
      <Icon icon={icon} className={`h-4 w-4 ${spin ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

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

function SidePanel({
  side,
  open,
  title,
  onClose,
  children,
}: {
  side: "left" | "right";
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={`
        absolute top-0 z-[11] h-full w-[360px] max-w-[92vw]
        transition-transform duration-200 ease-out
        ${side === "left" ? "left-0" : "right-0"}
        ${
          open
            ? "translate-x-0"
            : side === "left"
            ? "-translate-x-full"
            : "translate-x-full"
        }
      `}
      aria-hidden={!open}
    >
      <div
        className="
          h-full
          border border-neutral-200 bg-white/95 backdrop-blur
          dark:border-white/10 dark:bg-[#0b1220]/85
          shadow-2xl
          flex flex-col
        "
      >
        <div className="shrink-0 px-4 py-3 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="
              inline-flex items-center justify-center
              h-8 w-8 rounded-xl
              border border-neutral-200 bg-white hover:bg-neutral-50
              dark:border-white/12 dark:bg-white/[0.06] dark:hover:bg-white/10
            "
            aria-label="패널 닫기"
            title="닫기"
          >
            <Icon icon="mdi:close" className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Blocks ---------------- */

function MetaBlock({ meta }: { meta: FakeMapMeta }) {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/f7934683-fa51-45b4-acf6-ebcb17f6899f", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "hydration-2",
      hypothesisId: "H2",
      location: "FullscreenDialog.tsx:MetaBlock",
      message: "formatted createdAt",
      data: { createdAt: meta.createdAt, createdAtLabel: meta.createdAtLabel },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-neutral-500 dark:text-white/60">제목</div>
        <div className="mt-1 font-semibold text-neutral-900 dark:text-white">
          {meta.title}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="소스" value={meta.sourceType} />
        <InfoItem
          label="생성"
          value={meta.createdAtLabel}
        />
        <InfoItem label="채널" value={meta.channelName ?? "없음"} />
        <InfoItem label="URL" value={meta.sourceUrl ? "있음" : "없음"} />
      </div>

      {meta.tags?.length > 0 && (
        <div>
          <div className="text-xs text-neutral-500 dark:text-white/60">태그</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="
                  rounded-full border border-neutral-200 bg-neutral-50
                  px-2 py-0.5 text-[11px] text-neutral-600
                  dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75
                "
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {meta.description && (
        <div>
          <div className="text-xs text-neutral-500 dark:text-white/60">설명</div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-white/80">
            {meta.description}
          </p>
        </div>
      )}

      {/* ✅ 숨김 옵션: 페이지로 열기 + 원본 열기 */}
      <div className="pt-1 flex flex-wrap gap-2">
        <a
          href="/maps/demo"
          target="_blank"
          rel="noreferrer"
          className="
            inline-flex items-center gap-1.5
            rounded-2xl border border-neutral-200 bg-white px-3 py-2
            text-xs font-semibold text-neutral-700 hover:bg-neutral-50
            dark:border-white/12 dark:bg-white/[0.06]
            dark:text-white/85 dark:hover:bg-white/10
          "
          title="정식 상세페이지로 열기"
        >
          <Icon icon="mdi:open-in-new" className="h-4 w-4" />
          페이지로 열기
        </a>

        {meta.sourceUrl && (
          <a
            href={meta.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="
              inline-flex items-center gap-1.5
              rounded-2xl border border-neutral-200 bg-white px-3 py-2
              text-xs font-semibold text-neutral-700 hover:bg-neutral-50
              dark:border-white/12 dark:bg-white/[0.06]
              dark:text-white/85 dark:hover:bg-white/10
            "
          >
            <Icon icon="mdi:open-in-new" className="h-4 w-4" />
            원본 열기
          </a>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[0.06]">
      <div className="text-[11px] text-neutral-500 dark:text-white/60">
        {label}
      </div>
      <div className="mt-1 text-xs font-semibold text-neutral-800 dark:text-white/85 truncate">
        {value}
      </div>
    </div>
  );
}
