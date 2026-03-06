"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import LeftPanel from "@/components/maps/LeftPanel";
import RightPanel from "@/components/maps/RightPanel";
import MapControls from "@/components/maps/MapControls";
import ClientMindElixir, {
  type ClientMindElixirHandle,
} from "@/components/ClientMindElixir";
import { MIND_THEMES, MIND_THEME_BY_NAME } from "@/components/maps/themes";

const DEFAULT_THEME_NAME = "Default";
const PROFILE_THEME_NAME = "내설정테마";
import MetadataDialog from "@/app/[locale]/(main)/video-to-map/MetadataDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";
import { loadingMindElixir } from "@/app/lib/g6/sampleData";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";

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

function detectSourceType(sourceUrl?: string) {
  if (!sourceUrl) return "manual" as const;
  const lowered = sourceUrl.toLowerCase();
  if (lowered.includes("youtube.com") || lowered.includes("youtu.be")) {
    return "youtube" as const;
  }
  return "website" as const;
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
    summary: row.summary ?? undefined,
    status: coerceMapStatus(row.map_status),
    creditsCharged:
      typeof row.credits_charged === "number" ? row.credits_charged : undefined,
  };
}

export default function MapDetailPage() {
  const t = useTranslations("FullscreenMapPage");
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { profileThemeName } = useMindThemePreference();

  const mapId = String(params?.mapId ?? "");

  const [draft, setDraft] = useState<MapDraft | null>(null);
  const [mapData, setMapData] = useState<any | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [rightTab, setRightTab] = useState<"notes" | "terms">("notes");
  const [editMode, setEditMode] = useState<"view" | "edit">("view");
  const [panMode, setPanMode] = useState(false);
  const [themeName, setThemeName] = useState<string>(
    profileThemeName ? PROFILE_THEME_NAME : DEFAULT_THEME_NAME
  );
  const themeInitRef = useRef(false);
  const themeOptions = useMemo(
    () => [{ name: PROFILE_THEME_NAME }, { name: DEFAULT_THEME_NAME }, ...MIND_THEMES],
    []
  );
  const mindRef = useRef<ClientMindElixirHandle | null>(null);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [editHintPulse, setEditHintPulse] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const lastSavedDraftRef = useRef<string | null>(null);
  const lastAutoSaveErrorRef = useRef<number>(0);
  const savedPulseTimerRef = useRef<number | null>(null);
  const editHintTimerRef = useRef<number | null>(null);
  const lastEditHintRef = useRef<number>(0);
  const lastHighlightToastRef = useRef<number>(0);
  const highlightSaveTimerRef = useRef<number | null>(null);
  const lastSavedHighlightRef = useRef<string | null>(null);

  const MUTATING_OPS = useMemo(
    () =>
      new Set([
        "addChild",
        "insertParent",
        "insertSibling",
        "removeNodes",
        "moveUpNode",
        "moveDownNode",
        "moveNodeIn",
        "moveNodeBefore",
        "moveNodeAfter",
        "undo",
        "redo",
        "finishEdit",
        "finishEditSummary",
        "finishEditArrowLabel",
        "reshapeNode",
        "createArrow",
        "removeArrow",
        "createSummary",
        "removeSummary",
        "copyNode",
        "copyNodes",
        "toggleHighlight",
      ]),
    []
  );

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
            "id,created_at,updated_at,title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged,mind_elixir,mind_elixir_draft,mind_theme_override"
          )
          .eq("id", mapId)
          .single();

        if (cancelled) return;
        if (error) throw error;

        const row = data as MapRow & {
          mind_elixir?: any;
          mind_elixir_draft?: any;
        };
        setDraft(toDraft(row));

        const draftMind = row?.mind_elixir_draft ?? null;
        const mind = row?.mind_elixir ?? null;
        const effectiveMind = draftMind ?? mind ?? null;

        setHasDraft(Boolean(draftMind));
        if (!effectiveMind) {
          throw new Error("mind_elixir 데이터가 없습니다.");
        }
        setMapData(effectiveMind);

        const override = row?.mind_theme_override ?? null;
        if (override) {
          setThemeName(override);
        } else {
          setThemeName(profileThemeName ? PROFILE_THEME_NAME : DEFAULT_THEME_NAME);
        }
        themeInitRef.current = true;
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "구조맵을 불러오지 못했습니다.");
        setDraft(null);
        setMapData(null);
        setHasDraft(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapId]);

  useEffect(() => {
    if (!themeInitRef.current) {
      setThemeName(profileThemeName ? PROFILE_THEME_NAME : DEFAULT_THEME_NAME);
      themeInitRef.current = true;
      return;
    }
    if (!profileThemeName && themeName === PROFILE_THEME_NAME) {
      setThemeName(DEFAULT_THEME_NAME);
    }
  }, [profileThemeName, themeName]);

  const title = useMemo(() => draft?.title ?? t("fallbackTitle"), [draft?.title, t]);

  const openMeta = () => {
    setLeftOpen((v) => {
      const next = !v;
      if (next) setRightOpen(false);
      return next;
    });
  };

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

  useEffect(() => {
    mindRef.current?.setPanMode(panMode);
  }, [panMode]);

  const scheduleAutoSave = () => {
    if (!mapId) return;
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = window.setTimeout(async () => {
      const snapshot = mindRef.current?.getSnapshot?.();
      if (!snapshot) return;
      const payload = JSON.stringify(snapshot);
      if (payload === lastSavedDraftRef.current) return;

      setIsSavingDraft(true);
      try {
        await fetch(`/api/maps/${mapId}/draft`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mind_elixir_draft: snapshot }),
        });
        lastSavedDraftRef.current = payload;
        setHasDraft(true);
        setSavedPulse(true);
        if (savedPulseTimerRef.current) {
          window.clearTimeout(savedPulseTimerRef.current);
        }
        savedPulseTimerRef.current = window.setTimeout(() => {
          setSavedPulse(false);
        }, 1200);
      } catch {
        const now = Date.now();
        if (now - lastAutoSaveErrorRef.current > 10_000) {
          lastAutoSaveErrorRef.current = now;
          toast.message("자동 저장에 실패했습니다.");
        }
      } finally {
        setIsSavingDraft(false);
      }
    }, 1200);
  };

  const scheduleHighlightSave = () => {
    if (!mapId) return;
    if (highlightSaveTimerRef.current) {
      window.clearTimeout(highlightSaveTimerRef.current);
    }
    highlightSaveTimerRef.current = window.setTimeout(async () => {
      const snapshot = mindRef.current?.getSnapshot?.();
      if (!snapshot) return;
      const payload = JSON.stringify(snapshot);
      if (payload === lastSavedHighlightRef.current) return;

      try {
        await fetch(`/api/maps/${mapId}/mind`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mind_elixir: snapshot }),
        });
        lastSavedHighlightRef.current = payload;
        const now = Date.now();
        if (now - lastHighlightToastRef.current > 2000) {
          lastHighlightToastRef.current = now;
          toast.message("하이라이트 변경 저장했습니다.");
        }
      } catch {
        const now = Date.now();
        if (now - lastAutoSaveErrorRef.current > 10_000) {
          lastAutoSaveErrorRef.current = now;
          toast.message("하이라이트 저장에 실패했습니다.");
        }
      }
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
      if (highlightSaveTimerRef.current) {
        window.clearTimeout(highlightSaveTimerRef.current);
      }
      if (savedPulseTimerRef.current) {
        window.clearTimeout(savedPulseTimerRef.current);
      }
      if (editHintTimerRef.current) {
        window.clearTimeout(editHintTimerRef.current);
      }
    };
  }, []);

  const handleDelete = async () => {
    if (!mapId) return;
    setIsDeleting(true);

    try {
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

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error("환경변수 NEXT_PUBLIC_API_BASE_URL이 없습니다.");
      }

      const res = await fetch(`${base}/maps/${mapId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.message || json?.error || "요청 실패";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
      }

      toast.success("삭제 완료");
      window.setTimeout(() => {
        router.push("/maps");
      }, 700);
    } catch (e: any) {
      const msg = e?.message ?? "삭제에 실패했습니다.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveMetadata = async (meta: {
    sourceUrl?: string;
    title: string;
    channelName?: string;
    thumbnailUrl?: string;
    tags: string[];
    description?: string;
  }) => {
    if (!mapId) return;
    setIsSavingMeta(true);

    try {
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

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error("환경변수 NEXT_PUBLIC_API_BASE_URL이 없습니다.");
      }

      const res = await fetch(`${base}/maps/${mapId}/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: meta.title,
          description: meta.description,
          tags: meta.tags ?? [],
          thumbnail_url: meta.thumbnailUrl,
          channel_name: meta.channelName,
          source_type: detectSourceType(meta.sourceUrl),
          source_url: meta.sourceUrl,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.message || json?.error || "요청 실패";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
      }

      const { data, error } = await supabase
        .from("maps")
        .select(
          "id,created_at,updated_at,title,channel_name,source_url,source_type,tags,description,thumbnail_url,map_status,credits_charged"
        )
        .eq("id", mapId)
        .single();

      if (error) throw error;
      if (data) {
        setDraft(toDraft(data as MapRow));
      }

      setShowMetadataDialog(false);
    } catch (e: any) {
      const msg = e?.message ?? "메타데이터 저장에 실패했습니다.";
      console.error(msg);
      window.alert(msg);
    } finally {
      setIsSavingMeta(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-white dark:bg-[#0b1220] [--header-h:56px] max-[738px]:[--header-h:96px]">
      <header
        className="relative z-[20] w-full border-b border-neutral-200/80 bg-white/92 backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/88"
        style={{ height: "var(--header-h)" }}
      >
        <div className="h-full px-4 flex flex-row items-center justify-between gap-3 max-[738px]:flex-col max-[738px]:items-start max-[738px]:gap-2 max-[738px]:py-2">
          <div className="min-w-0 flex items-center gap-2 w-full flex-1">
            <button
              type="button"
              onClick={() => router.push("/maps")}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-transparent bg-neutral-100/70 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200/70 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/[0.12] whitespace-nowrap"
            >
              <Icon icon="mdi:arrow-left" className="h-4 w-4" />
              {t("backToList")}
            </button>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white/90 truncate">
              {title}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-nowrap shrink-0 min-w-[240px] max-[738px]:min-w-0 max-[738px]:flex-wrap max-[738px]:w-full max-[738px]:justify-center max-[738px]:pt-2 max-[738px]:pb-1 max-[738px]:border-t max-[738px]:border-neutral-200/70 dark:max-[738px]:border-white/10 sm:flex-nowrap">
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

            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                aria-label="More actions"
              >
                <Icon icon="mdi:dots-horizontal" className="h-4 w-4" />
              </button>

              {moreOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 min-w-[140px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]"
                >
                    <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      setConfirmDeleteOpen(true);
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon icon="mdi:trash-outline" className="h-4 w-4" />
                      {t("actions.delete")}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-500 dark:text-white/60">
            {loading ? t("status.loading") : ""}
            {!loading && error ? t("status.loadFailed") : ""}
          </div>
        </div>
      </header>

      <div className="relative w-full" style={{ height: "calc(100% - var(--header-h))" }}>
        <div className="absolute inset-0 bg-[#f6f7fb] dark:bg-[#070c16]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-30 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
        />
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(closest-side,black,transparent)] bg-[radial-gradient(900px_520px_at_50%_30%,rgba(59,130,246,0.10),transparent_62%)] dark:bg-[radial-gradient(900px_520px_at_50%_30%,rgba(56,189,248,0.10),transparent_62%)]" />

        <div className="absolute inset-0">
          <div className="h-full w-full rounded-2xl border border-neutral-200/70 bg-white/65 backdrop-blur-sm shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <ClientMindElixir
              ref={mindRef}
              mode={resolvedTheme === "dark" ? "dark" : "light"}
              editMode={editMode}
              onChange={(op) => {
                if (!op?.name) return;
                if (op.name === "toggleHighlight") {
                  if (editMode === "view") {
                    scheduleHighlightSave();
                  } else {
                    scheduleAutoSave();
                  }
                  return;
                }
                if (op.name === "updateNote") {
                  const now = Date.now();
                  if (now - lastHighlightToastRef.current > 2000) {
                    lastHighlightToastRef.current = now;
                    toast.message("노트 변경을 저장 중...");
                  }
                  if (editMode === "view") {
                    scheduleHighlightSave();
                  } else {
                    scheduleAutoSave();
                  }
                  return;
                }
                if (editMode !== "edit") return;
                if (!MUTATING_OPS.has(op.name)) return;
                scheduleAutoSave();
              }}
              onViewModeEditAttempt={() => {
                if (editMode !== "view") return;
                const now = Date.now();
                if (now - lastEditHintRef.current < 5000) return;
                lastEditHintRef.current = now;
                toast.custom(
                  () => (
                    <div className="rounded-2xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-lg">
                      편집하려면 편집 모드로 전환해주세요.
                    </div>
                  ),
                  { duration: 2600 }
                );
                setEditHintPulse(true);
                if (editHintTimerRef.current) {
                  window.clearTimeout(editHintTimerRef.current);
                }
                editHintTimerRef.current = window.setTimeout(() => {
                  setEditHintPulse(false);
                }, 1600);
              }}
              theme={
                themeName === DEFAULT_THEME_NAME
                  ? null
                  : themeName === PROFILE_THEME_NAME
                  ? undefined
                  : MIND_THEME_BY_NAME[themeName]
              }
              data={mapData ?? undefined}
              loading={loading}
              placeholderData={loadingMindElixir}
            />
          </div>
        </div>

        <MapControls
          editMode={editMode}
          panMode={panMode}
          themes={themeOptions}
          currentThemeName={themeName}
          hasDraft={hasDraft}
          highlightEditToggle={editHintPulse}
          statusLabel={
            isSavingDraft
              ? "자동 저장 중…"
              : savedPulse
              ? "저장됨"
              : hasDraft
              ? "임시 변경 있음"
              : undefined
          }
          statusTone={
            isSavingDraft ? "warning" : savedPulse ? "success" : "neutral"
          }
          onToggleEdit={() =>
            setEditMode((m) => (m === "view" ? "edit" : "view"))
          }
          onTogglePanMode={() => setPanMode((v) => !v)}
          onSelectTheme={async (name) => {
            setThemeName(name);
            if (!mapId) return;

            const override =
              name === PROFILE_THEME_NAME
                ? null
                : name === DEFAULT_THEME_NAME
                ? DEFAULT_THEME_NAME
                : name;

            await fetch(`/api/maps/${mapId}/theme`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mind_theme_override: override }),
            }).catch(() => {});
          }}
          onCollapseAll={() => mindRef.current?.collapseAll()}
          onExpandAll={() => mindRef.current?.expandAll()}
          onExpandLevel={() => mindRef.current?.expandOneLevel()}
          onCollapseLevel={() => mindRef.current?.collapseOneLevel()}
          onPublish={() => {
            (async () => {
              if (!mapId) return;
              try {
                const res = await fetch(`/api/maps/${mapId}/publish`, {
                  method: "POST",
                });
                if (!res.ok) throw new Error("발행 실패");
                setHasDraft(false);
                lastSavedDraftRef.current = null;
                // 발행된 원본을 다시 동기화
                try {
                  const supabase = createClient();
                  const { data, error } = await supabase
                    .from("maps")
                    .select("mind_elixir")
                    .eq("id", mapId)
                    .single();
                  if (!error && data?.mind_elixir) {
                    setMapData(data.mind_elixir);
                  }
                } catch {
                  // ignore
                }
                toast.message("발행이 완료되었습니다.");
              } catch {
                toast.message("발행에 실패했습니다.");
              }
            })();
          }}
          onShare={() => {
            toast.message("공유 기능은 준비 중입니다.");
          }}
          onDiscardDraft={() => {
            (async () => {
              if (!mapId) return;
              try {
                const res = await fetch(`/api/maps/${mapId}/draft`, {
                  method: "DELETE",
                });
                if (!res.ok) throw new Error("삭제 실패");
                setHasDraft(false);
                lastSavedDraftRef.current = null;
                // 원본 맵으로 즉시 되돌리기
                try {
                  const supabase = createClient();
                  const { data, error } = await supabase
                    .from("maps")
                    .select("mind_elixir")
                    .eq("id", mapId)
                    .single();
                  if (!error && data?.mind_elixir) {
                    setMapData(data.mind_elixir);
                  }
                } catch {
                  // ignore
                }
                toast.message("임시 변경을 버렸습니다.");
              } catch {
                toast.message("임시 변경 버리기에 실패했습니다.");
              }
            })();
          }}
        />

        {error && (
          <div className="absolute left-4 top-3 z-[15]">
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
              <Icon icon="mdi:alert-circle-outline" className="h-3.5 w-3.5" />
              {t("status.fetchError")}
            </span>
          </div>
        )}

        {draft && (
          <LeftPanel
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
            onEdit={() => setShowMetadataDialog(true)}
            map={draft}
          />
        )}

        <RightPanel
          open={rightOpen}
          onClose={() => setRightOpen(false)}
          initialTab={rightTab}
          mapId={mapId}
        />

        {showMetadataDialog && draft && (
          <MetadataDialog
            mapId={draft.id}
            initial={{
              sourceUrl: draft.sourceUrl ?? "",
              title: draft.title ?? "",
              channelName: draft.channelName ?? "",
              tags: draft.tags ?? [],
              description: draft.description ?? "",
              thumbnailUrl: draft.thumbnailUrl ?? "",
            }}
            onClose={() => setShowMetadataDialog(false)}
            onSave={handleSaveMetadata}
            isProcessing={isSavingMeta}
          />
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          handleDelete();
        }}
        title={t("deleteConfirm.title")}
        description={t("deleteConfirm.description")}
        actionLabel={
          isDeleting ? t("deleteConfirm.actionDeleting") : t("deleteConfirm.action")
        }
      />

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
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
        pressed
          ? "border-blue-500 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)] dark:border-blue-300 dark:bg-blue-500/35 dark:text-blue-50 dark:shadow-[0_10px_24px_rgba(59,130,246,0.35)]"
          : "border-blue-200/70 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 dark:border-blue-300/50 dark:bg-blue-500/10 dark:text-blue-50/90 hover:dark:bg-blue-500/20"
      }`}
      aria-label={label}
      title={label}
    >
      <Icon icon={icon} className="h-4 w-4" />
      <span className="hidden sm:inline max-[738px]:inline">{label}</span>
    </button>
  );
}
