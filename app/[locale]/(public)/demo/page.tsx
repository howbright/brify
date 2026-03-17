"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";

import { Link } from "@/i18n/navigation";
import { brifyDemoSample } from "@/app/lib/demo/brifyDemoSample";
import {
  DEFAULT_THEME_NAME,
  MIND_THEME_BY_NAME,
} from "@/components/maps/themes";
import type { ClientMindElixirHandle } from "@/components/ClientMindElixir";
import { loadingMindElixir } from "@/app/lib/g6/sampleData";

const ClientMindElixir = dynamic(() => import("@/components/ClientMindElixir"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center rounded-[28px] border border-sky-100 bg-white text-sm font-semibold text-slate-500 shadow-sm">
      구조맵을 불러오는 중입니다...
    </div>
  ),
});

const DEMO = brifyDemoSample;

type DemoTab = "map" | "summary" | "source";

export default function DemoPage() {
  const mindRef = useRef<ClientMindElixirHandle | null>(null);
  const [activeTab, setActiveTab] = useState<DemoTab>("map");

  const theme = useMemo(() => {
    const namedTheme = MIND_THEME_BY_NAME[DEMO.mindThemeName];
    return namedTheme ?? MIND_THEME_BY_NAME[DEFAULT_THEME_NAME] ?? undefined;
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#fef6ec_42%,#ffffff_100%)] text-slate-900">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-10 pt-14 md:px-10 lg:pt-20">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Interactive Demo
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              결과를 먼저 보고,
              <br />
              마음이 생기면 바로 시작하는 데모
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              긴 유튜브 설명이 Brify에서 어떤 식으로 요약되고 구조화되는지
              바로 확인해보세요. 이 화면은 로그인 없이 체험할 수 있는
              샘플 결과이며, 아래에서 구조맵과 요약을 자유롭게 둘러볼 수
              있습니다.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/video-to-map"
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-20px_rgba(2,132,199,0.85)] transition-transform hover:scale-[1.02]"
              >
                내 콘텐츠로 무료 시작하기
              </Link>
              <a
                href={DEMO.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-700"
              >
                원본 영상 보기
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="입력 타입"
                value="YouTube"
                hint="긴 영상 설명을 구조화"
              />
              <StatCard
                label="핵심 패턴"
                value={DEMO.durationLabel}
                hint="단식 윈도우를 즉시 파악"
              />
              <StatCard
                label="데모 방식"
                value="즉시 결과"
                hint="OpenAI 재호출 없이 바로 체험"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] border border-slate-100 bg-slate-100">
              <img
                src={DEMO.thumbnailUrl}
                alt={DEMO.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  Sample Video
                </div>
                <h2 className="mt-2 text-xl font-bold leading-snug">
                  {DEMO.title}
                </h2>
                <p className="mt-2 text-sm text-white/80">{DEMO.channelName}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {DEMO.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_24px_80px_-45px_rgba(15,23,42,0.35)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                Sample Result
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Brify가 이 영상을 이렇게 정리합니다
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                먼저 완성 결과를 보여주고, 그다음 구조맵과 요약을 직접
                탐색하게 하는 데모 흐름입니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <TabButton
                active={activeTab === "map"}
                onClick={() => setActiveTab("map")}
                label="구조맵"
              />
              <TabButton
                active={activeTab === "summary"}
                onClick={() => setActiveTab("summary")}
                label="핵심 요약"
              />
              <TabButton
                active={activeTab === "source"}
                onClick={() => setActiveTab("source")}
                label="샘플 입력"
              />
            </div>
          </div>

          {activeTab === "map" && (
            <div className="pt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    구조맵 탐색
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    핵심 흐름을 위에서 아래로 읽지 말고, 가지를 펼치며 빠르게
                    훑어보세요.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <MapActionButton
                    onClick={() => mindRef.current?.expandAll()}
                    icon="mdi:unfold-more-horizontal"
                    label="전체 펼치기"
                  />
                  <MapActionButton
                    onClick={() => mindRef.current?.collapseAll()}
                    icon="mdi:unfold-less-horizontal"
                    label="전체 접기"
                  />
                  <MapActionButton
                    onClick={() => mindRef.current?.centerMap()}
                    icon="mdi:crosshairs-gps"
                    label="가운데 정렬"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-sky-100 bg-[radial-gradient(circle_at_top,#eff6ff,transparent_40%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-2">
                <ClientMindElixir
                  ref={mindRef}
                  mode="light"
                  theme={theme}
                  data={DEMO.mindData}
                  placeholderData={loadingMindElixir}
                  editMode="view"
                  fitOnInit
                  preserveViewState
                  openMenuOnClick={false}
                  showMiniMap
                />
              </div>
            </div>
          )}

          {activeTab === "summary" && (
            <div className="grid gap-5 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-[28px] border border-amber-100 bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ed_100%)] p-6">
                <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                  Summary
                </div>
                <p className="mt-4 text-[15px] leading-8 text-slate-700">
                  {DEMO.summary}
                </p>
              </article>

              <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Key Points
                </div>
                <div className="mt-4 space-y-3">
                  {DEMO.keyPoints.map((point, index) => (
                    <div
                      key={point}
                      className="flex gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-slate-700">{point}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}

          {activeTab === "source" && (
            <div className="grid gap-5 pt-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Why This Works
                </div>
                <div className="mt-4 space-y-4">
                  <InfoRow
                    label="원본 길이"
                    value="긴 설명문과 식단 예시가 섞인 5,000자+ 분량"
                  />
                  <InfoRow
                    label="Brify 포인트"
                    value="시간 흐름, 식사 구성, 핵심 이유를 분리해서 다시 읽기 쉽게 정리"
                  />
                  <InfoRow
                    label="전환 포인트"
                    value="샘플을 본 뒤 자신의 영상이나 글로 바로 시도하게 유도"
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <Icon icon="mdi:file-document-outline" className="h-4 w-4" />
                  Source Preview
                </div>
                <div className="mt-4 space-y-3">
                  {DEMO.sourcePreview.map((line, index) => (
                    <div
                      key={`${index}-${line}`}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-sky-200 bg-[linear-gradient(135deg,#082f49_0%,#0f766e_100%)] px-6 py-8 text-white shadow-[0_24px_80px_-40px_rgba(8,47,73,0.7)] sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                Next Step
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                이제 내 콘텐츠로 같은 경험을 만들어보세요
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-cyan-50/85">
                데모는 이미 완성된 샘플이지만, 실제 사용 흐름은 훨씬 간단합니다.
                영상 링크나 텍스트만 넣으면 Brify가 요약과 구조맵을 함께
                만들어줍니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/video-to-map"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-sky-800 transition-transform hover:scale-[1.02]"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/15"
              >
                요금 보기
              </Link>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function MapActionButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-700"
    >
      <Icon icon={icon} className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-sm leading-6 text-slate-500">{hint}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
