"use client";

import dynamic from "next/dynamic";

const FullscreenMapDetailScreen = dynamic(
  () => import("@/components/maps/FullscreenMapDetailScreen"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[120] bg-[linear-gradient(180deg,#f6f8fc_0%,#eef3fb_100%)] dark:bg-[linear-gradient(180deg,#09111d_0%,#0b1220_100%)]">
        <div className="flex h-full items-center justify-center px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#0f172a] dark:text-slate-200">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-200" />
          </div>
        </div>
      </div>
    ),
  }
);

type MapDetailClientProps = {
  locale: string;
  mapId: string;
  sourceTab: string | null;
};

export default function MapDetailClient({
  locale,
  mapId,
  sourceTab,
}: MapDetailClientProps) {
  return (
    <FullscreenMapDetailScreen
      mapId={mapId}
      locale={locale}
      sourceTab={sourceTab}
      accessMode="user"
    />
  );
}
