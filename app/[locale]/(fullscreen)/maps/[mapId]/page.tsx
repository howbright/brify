"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import LeftPanel from "@/components/maps/LeftPanel";
import RightPanel from "@/components/maps/RightPanel";
import ClientMindElixir from "@/components/ClientMindElixir";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";
import { loadingMindElixir } from "@/app/lib/g6/sampleData";

const HEADER_H = 56;

type MapRow = Database["public"]["Tables"]["maps"]["Row"];

function coerceMapStatus(status?: string | null): MapJobStatus {
  if (status === "done" || status === "failed" || status === "processing") {
    return status;
  }
  return "processing";
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

function toDraft(row: MapRow): MapDraft {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
    sourceUrl: row.source_url ?? undefined,
    sourceType: row.source_type ?? undefined,
    title: row.title ?? "제목없음",
    channelName: row.channel_name ?? undefined,
    thumbnailUrl: row.thumbnail_url ? withCacheBuster(row.thumbnail_url) : undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    description: row.description ?? undefined,
    status: coerceMapStatus(row.map_status),
    creditsCharged:
      typeof row.credits_charged === "number" ? row.credits_charged : undefined,
  };
}

export default function MapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const mapId = String(params?.mapId ?? "");

  const [draft, setDraft] = useState<MapDraft | null>(null);
  const [mapData, setMapData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [editMode, setEditMode] = useState<"view" | "edit">("view");

  useEffect(() => {
    if (!mapId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("maps")
          .select(
            "id,created_at,updated_at,title,channel_name,source_url,source_type,tags,description,thumbnail_url,map_status,credits_charged,mind_elixir"
          )
          .eq("id", mapId)
          .single();

        if (cancelled) return;
        if (error) throw error;

        const row = data as MapRow & { mind_elixir?: any };
        setDraft(toDraft(row));

        const mind = row?.mind_elixir ?? null;
        if (!mind) {
          throw new Error("mind_elixir 데이터가 없습니다.");
        }
        setMapData(mind);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "구조맵을 불러오지 못했습니다.");
        setDraft(null);
        setMapData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapId]);

  const title = useMemo(() => draft?.title ?? "구조맵", [draft?.title]);

  const openMeta = () => {
    setLeftOpen((v) => {
      const next = !v;
      if (next) setRightOpen(false);
      return next;
    });
  };

  const openDetails = () => {
    setRightOpen((v) => !v);
    if (!rightOpen) {
      setLeftOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-white dark:bg-[#0b1220]">
      <header
        className="relative z-[20] w-full border-b border-neutral-200/80 bg-white/92 backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/88"
        style={{ height: HEADER_H }}
      >
        <div className="h-full px-4 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/maps")}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
            >
              <Icon icon="mdi:arrow-left" className="h-4 w-4" />
              목록
            </button>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white/90 truncate">
              {title}
            </div>
          </div>

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

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-500 dark:text-white/60">
            {loading ? "불러오는 중" : ""}
            {!loading && error ? "불러오기 실패" : ""}
          </div>
        </div>
      </header>

      <div className="relative w-full" style={{ height: `calc(100% - ${HEADER_H}px)` }}>
        <div className="absolute inset-0 bg-[#f6f7fb] dark:bg-[#070c16]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-30 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
        />
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(closest-side,black,transparent)] bg-[radial-gradient(900px_520px_at_50%_30%,rgba(59,130,246,0.10),transparent_62%)] dark:bg-[radial-gradient(900px_520px_at_50%_30%,rgba(56,189,248,0.10),transparent_62%)]" />

        <div className="absolute inset-0">
          <div className="h-full w-full rounded-2xl border border-neutral-200/70 bg-white/65 backdrop-blur-sm shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <ClientMindElixir
              mode={resolvedTheme === "dark" ? "dark" : "light"}
              dragButton={2}
              data={mapData ?? undefined}
              loading={loading}
              placeholderData={loadingMindElixir}
            />
          </div>
        </div>

        <div className="absolute right-4 top-3 z-[15]">
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white/80 px-2.5 py-1 text-[11px] text-neutral-600 dark:border-white/10 dark:bg-[#0b1220]/60 dark:text-white/65">
            <Icon icon="mdi:gesture-tap" className="h-3.5 w-3.5" />
            {editMode === "edit"
              ? "편집모드: 노드 수정/추가 가능"
              : "보기모드: 흐름을 집중해서 확인"}
          </span>
        </div>

        {error && (
          <div className="absolute left-4 top-3 z-[15]">
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
              <Icon icon="mdi:alert-circle-outline" className="h-3.5 w-3.5" />
              구조맵을 불러오지 못했어요
            </span>
          </div>
        )}

        {draft && (
          <LeftPanel open={leftOpen} onClose={() => setLeftOpen(false)} map={draft} />
        )}

        <RightPanel
          open={rightOpen}
          onClose={() => setRightOpen(false)}
          mapId={mapId}
          terms={[]}
          termsLoading={false}
          onFetchTerms={function (): Promise<void> {
            throw new Error("Function not implemented.");
          }}
        />
      </div>
    </div>
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
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
        pressed
          ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/12 dark:text-blue-200"
          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
      }`}
      aria-label={label}
      title={label}
    >
      <Icon icon={icon} className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
