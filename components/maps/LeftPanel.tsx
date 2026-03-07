"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";

export default function LeftPanel({
  open,
  onClose,
  onEdit,
  map,
}: {
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  map: MapDraft;
}) {
  const t = useTranslations("LeftPanel");
  const createdLabel = useMemo(
    () => safeDateLabel(map.createdAt),
    [map.createdAt]
  );
  const updatedLabel = useMemo(
    () => safeDateLabel(map.updatedAt),
    [map.updatedAt]
  );
  const sourceType = useMemo(() => map.sourceType ?? "text", [map.sourceType]);

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
          border-r border-neutral-300 bg-white
          dark:border-white/15 dark:bg-[#0b1220]
          shadow-[18px_0_45px_-30px_rgba(15,23,42,0.55)]
          dark:shadow-[18px_0_70px_-45px_rgba(0,0,0,0.9)]
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
                  {t("title")}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="
                    shrink-0
                    inline-flex items-center gap-1.5
                    rounded-2xl border border-blue-200 bg-blue-50 px-3 py-1.5
                    text-xs font-semibold text-blue-700 hover:bg-blue-100
                    dark:border-blue-300/40 dark:bg-blue-500/10
                    dark:text-blue-50/90 dark:hover:bg-blue-500/20
                  "
                >
                  <Icon icon="mdi:pencil" className="h-4 w-4" />
                  {t("edit")}
                </button>
              )}

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
                {t("close")}
              </button>
            </div>
          </div>

          <div className="mt-3">
            <div className="hidden max-[738px]:block text-sm font-semibold text-neutral-900 dark:text-white/90 whitespace-normal break-words">
              {map.title ?? t("untitled")}
            </div>
            {/* ✅ 시간 존재감 축소: 한 줄, 작고 흐리게 */}
            <div className="text-[11px] text-neutral-400 dark:text-white/40">
              {t("created")} {createdLabel} · {t("updated")} {updatedLabel}
            </div>

            {/* ✅ 크레딧도 존재감 축소: 한 줄만 */}
            <div className="mt-0.5 text-[11px] text-neutral-400 dark:text-white/40">
              {t("credits")}:{" "}
              <span className="text-neutral-600 dark:text-white/70 font-semibold">
                {typeof map.creditsCharged === "number"
                  ? map.creditsCharged
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* body */}
        <div className="relative h-[calc(100%-64px)] overflow-y-auto px-4 py-4">
          {map.summary ? (
            <section className="mb-4">
              <div className="mb-2.5 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-blue-200 dark:bg-blue-500/40" />
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white/85">
                  한문단요약
                </h3>
              </div>
              <div
                className="
                  rounded-3xl border border-blue-200/70 bg-blue-50/60 p-3.5
                  text-[12px] leading-5 text-neutral-700
                  shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)]
                  dark:border-blue-300/20 dark:bg-blue-500/10 dark:text-white/80
                  dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.55)]
                "
              >
                <p className="whitespace-pre-wrap break-words">
                  {map.summary}
                </p>
              </div>
            </section>
          ) : null}

          {/* 출처 */}
          <Section title={t("sourceSection")}>
            <div className="flex gap-3">
              <div
                className="
                  relative h-16 w-28 rounded-2xl overflow-hidden
                  border border-neutral-200 bg-neutral-50 flex-shrink-0
                  dark:border-white/10 dark:bg-white/[0.06]
                "
              >
                {map.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={map.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-[11px] text-neutral-400 dark:text-white/45">
                      {t("thumbnailPlaceholder")}
                    </div>
                  )}
              </div>

              <div className="min-w-0 flex-1">
                <RowItem
                  icon="mdi:youtube"
                  label={t("sourceType")}
                  value={sourceType}
                />
                <RowItem
                  icon="mdi:account-circle-outline"
                  label={t("channel")}
                  value={map.channelName ?? t("none")}
                />

                <div className="mt-1">
                  <div className="text-[11px] text-neutral-500 dark:text-white/60">
                    {t("sourceLink")}
                  </div>
                  {map.sourceUrl ? (
                    <a
                      href={map.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="
                        mt-0.5 block text-xs font-semibold
                        text-blue-700 hover:underline truncate
                        dark:text-sky-200
                      "
                      title={map.sourceUrl}
                    >
                      {map.sourceUrl}
                    </a>
                  ) : (
                    <div className="mt-0.5 text-xs text-neutral-700 dark:text-white/85">
                      {t("none")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* ✅ 태그: description 보다 위로 올림 */}
          <Section title={t("tagsSection")}>
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
              <EmptyText>{t("noTags")}</EmptyText>
            )}
          </Section>

          {/* ✅ description: 접기/펼치기 제거 → 항상 노출 */}
          <Section title={t("descriptionSection")}>
            <div className="text-xs text-neutral-700 dark:text-white/80 whitespace-pre-wrap break-words">
              {map.description ?? t("noDescription")}
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

function safeDateLabel(ts?: number) {
  if (!ts) return "-";
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  } catch {
    return "-";
  }
}
