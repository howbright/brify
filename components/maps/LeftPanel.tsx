"use client";

import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

export type MapRow = {
  id: string;
  user_id: string;

  title: string;
  description: string | null;
  tags: string[];

  channel_name: string | null;
  source_type: string; // Database enum string
  source_url: string | null;
  thumbnail_url: string | null;

  created_at: string;
  updated_at: string;

  extract_error: string | null;
  extract_job_id: string | null;
  extract_status: string; // Database enum string
  extracted_text: string | null;

  map_status: string; // Database enum string
  mind_elixir: any | null;
  mind_elixir_draft: any | null;

  output_language: string | null;

  required_credits: number;
  credits_charged: number;
  credits_charged_at: string | null;

  schema_version: number;
};

export default function LeftPanel({
  open,
  onClose,
  map,
}: {
  open: boolean;
  onClose: () => void;
  map: MapRow;
}) {
  const createdLabel = useMemo(
    () => safeDateLabel(map.created_at),
    [map.created_at]
  );
  const updatedLabel = useMemo(
    () => safeDateLabel(map.updated_at),
    [map.updated_at]
  );

  return (
    <aside
      className={`
        absolute top-0 left-0 z-[30]
        h-full w-[92vw] max-w-[420px]
        transition-transform duration-200 ease-out
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
      aria-hidden={!open}
    >
      <div
        className="
          relative h-full
          border-l border-neutral-200/80 bg-white/92 backdrop-blur
          dark:border-white/10 dark:bg-[#0b1220]/88
          shadow-[-20px_0_60px_-40px_rgba(15,23,42,0.55)]
          dark:shadow-[-30px_0_120px_-70px_rgba(0,0,0,0.95)]
        "
      >
        {/* highlight */}
        <div
          className="
            pointer-events-none absolute inset-0
            bg-[radial-gradient(900px_240px_at_10%_0%,rgba(59,130,246,0.10),transparent_60%)]
            dark:bg-[radial-gradient(900px_240px_at_10%_0%,rgba(56,189,248,0.12),transparent_60%)]
          "
        />
        <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />

        {/* header */}
        <div className="relative px-4 pt-4 pb-3 border-b border-neutral-200/70 dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white/90 truncate">
                  상세 정보
                </h2>
              </div>
            </div>

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

          {/* ✅ 제목만 보여주고 description은 여기서 제거 */}
          <div className="mt-3">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-2">
              {map.title}
            </p>

            {/* ✅ 시간 존재감 축소: 한 줄, 작고 흐리게 */}
            <div className="mt-1 text-[11px] text-neutral-400 dark:text-white/40">
              생성 {createdLabel} · 수정 {updatedLabel}
            </div>

            {/* ✅ 크레딧도 존재감 축소: 한 줄만 */}
            <div className="mt-0.5 text-[11px] text-neutral-400 dark:text-white/40">
              소요 크레딧:{" "}
              <span className="text-neutral-600 dark:text-white/70 font-semibold">
                {map.credits_charged}
              </span>
            </div>
          </div>
        </div>

        {/* body */}
        <div className="relative h-[calc(100%-64px)] overflow-y-auto px-4 py-4">
          {/* 출처 */}
          <Section title="출처">
            <div className="flex gap-3">
              <div
                className="
                  relative h-16 w-28 rounded-2xl overflow-hidden
                  border border-neutral-200 bg-neutral-50 flex-shrink-0
                  dark:border-white/10 dark:bg-white/[0.06]
                "
              >
                {map.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={map.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[11px] text-neutral-400 dark:text-white/45">
                    thumbnail
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <RowItem
                  icon="mdi:youtube"
                  label="source_type"
                  value={map.source_type}
                />
                <RowItem
                  icon="mdi:account-circle-outline"
                  label="channel"
                  value={map.channel_name ?? "없음"}
                />

                <div className="mt-1">
                  <div className="text-[11px] text-neutral-500 dark:text-white/60">
                    source_url
                  </div>
                  {map.source_url ? (
                    <a
                      href={map.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="
                        mt-0.5 block text-xs font-semibold
                        text-blue-700 hover:underline truncate
                        dark:text-sky-200
                      "
                      title={map.source_url}
                    >
                      {map.source_url}
                    </a>
                  ) : (
                    <div className="mt-0.5 text-xs text-neutral-700 dark:text-white/85">
                      없음
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* ✅ 태그: description 보다 위로 올림 */}
          <Section title="태그">
            {map.tags?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {map.tags.slice(0, 24).map((t) => (
                  <span
                    key={t}
                    className="
                      rounded-full border border-neutral-200 bg-neutral-50
                      px-2 py-0.5 text-[11px] text-neutral-600
                      dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75
                    "
                  >
                    #{t}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyText>태그 없음</EmptyText>
            )}
          </Section>

          {/* ✅ description: 접기/펼치기 제거 → 항상 노출 */}
          <Section title="설명">
            <div className="text-xs text-neutral-700 dark:text-white/80 whitespace-pre-wrap break-words">
              {map.description ?? "설명 없음"}
            </div>
          </Section>

          {/* ✅ 시간/크레딧/상태/데이터 섹션 제거 완료 */}
        </div>
      </div>
    </aside>
  );
}

/* ---------------- UI bits ---------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-neutral-200 dark:bg-white/15" />
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-white/85">
          {title}
        </h3>
      </div>

      <div
        className="
          rounded-3xl border border-neutral-200 bg-white p-3
          shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)]
          dark:border-white/10 dark:bg-white/[0.04]
          dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.55)]
        "
      >
        {children}
      </div>
    </section>
  );
}

function RowItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon
        icon={icon}
        className="h-4 w-4 text-neutral-500 dark:text-white/55"
      />
      <div className="min-w-0">
        <div className="text-[11px] text-neutral-500 dark:text-white/60">
          {label}
        </div>
        <div className="text-xs font-semibold text-neutral-800 dark:text-white/85 truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-neutral-500 dark:text-white/60">
      {children}
    </div>
  );
}

/* ---------------- helpers ---------------- */

function safeDateLabel(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
