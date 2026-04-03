"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";

type RecentInterestTag = {
  name: string;
  count: number;
};

type MapsRecentSectionsProps = {
  collapsed: boolean;
  onToggleCollapsed: (next: boolean) => void;
  recentDrafts: MapDraft[];
  recentInterestTags: RecentInterestTag[];
  getDisplayTitle: (draft: MapDraft) => string;
  onOpenDetail: (draft: MapDraft) => void;
  onSelectInterestTag: (tagName: string) => void;
};

export default function MapsRecentSections({
  collapsed,
  onToggleCollapsed,
  recentDrafts,
  recentInterestTags,
  getDisplayTitle,
  onOpenDetail,
  onSelectInterestTag,
}: MapsRecentSectionsProps) {
  const t = useTranslations("MapsCommon.recent");

  if (collapsed) {
    return (
      <div className="mt-0 mb-0">
        <div className="ml-auto flex w-full max-w-[420px] items-center justify-end gap-3 rounded-[18px] bg-transparent px-2 py-1.5">
          <div className="flex min-w-0 items-center justify-end gap-2 text-[13px] font-semibold text-neutral-800 dark:text-white/85">
            <Icon icon="mdi:history" className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
            <span className="truncate">{t("recentMaps")}</span>
            <span className="text-neutral-300 dark:text-white/20">·</span>
            <Icon
              icon="mdi:tag-heart-outline"
              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300"
            />
            <span className="truncate">{t("recentInterestTags")}</span>
          </div>
          <button
            type="button"
            onClick={() => onToggleCollapsed(false)}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-600 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/75 dark:hover:bg-white/[0.08]"
            aria-label={t("expandAria")}
          >
            <span>{t("expand")}</span>
            <Icon icon="mdi:chevron-down" className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 mb-3 grid gap-3 md:grid-cols-2">
      <section className="rounded-[22px] border border-blue-200 bg-white px-4 py-3 shadow-sm dark:border-blue-500/20 dark:bg-white/[0.05]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-extrabold text-neutral-900 dark:text-white">
              {t("recentMaps")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleCollapsed(true)}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/75 dark:hover:bg-white/[0.08]"
              aria-label={t("collapseAria")}
            >
              <span>{t("collapse")}</span>
              <Icon icon="mdi:chevron-up" className="h-3.5 w-3.5" />
            </button>
            <Icon icon="mdi:history" className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {recentDrafts.map((draft) => (
            <button
              key={`recent-${draft.id}`}
              type="button"
              onClick={() => onOpenDetail(draft)}
              className="inline-flex max-w-full items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[12px] font-semibold text-neutral-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80 dark:hover:border-blue-400/20 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
            >
              <span className="truncate">{getDisplayTitle(draft)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-emerald-200 bg-white px-4 py-3 shadow-sm dark:border-emerald-500/20 dark:bg-white/[0.05]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-extrabold text-neutral-900 dark:text-white">
              {t("recentInterestTags")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleCollapsed(true)}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/75 dark:hover:bg-white/[0.08]"
              aria-label={t("collapseAria")}
            >
              <span>{t("collapse")}</span>
              <Icon icon="mdi:chevron-up" className="h-3.5 w-3.5" />
            </button>
            <Icon icon="mdi:tag-heart-outline" className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {recentInterestTags.length > 0 ? (
            recentInterestTags.map((tag) => (
              <button
                key={`interest-${tag.name}`}
                type="button"
                onClick={() => onSelectInterestTag(tag.name)}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:border-emerald-300/30 dark:hover:bg-emerald-500/20"
              >
                <span className="truncate">#{tag.name}</span>
                <span className="text-[11px] text-emerald-600/80 dark:text-emerald-200/70">
                  {tag.count}
                </span>
              </button>
            ))
          ) : (
            <div className="text-[12px] text-neutral-500 dark:text-white/55">
              {t("emptyInterestTags")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
