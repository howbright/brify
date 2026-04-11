"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { resizeToWebp, validateImageFile } from "@/utils/image";

type Meta = {
  sourceUrl?: string;
  title: string;
  channelName?: string;
  thumbnailUrl?: string;
  tags: string[];
  description?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isYouTubeUrl(url: string) {
  const u = url.toLowerCase();
  return u.includes("youtube.com") || u.includes("youtu.be");
}

function normalizeTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(
    0,
    12
  );
}

function looksLikeRestrictedYoutubeError(message: string) {
  const lowered = message.toLowerCase();
  return (
    lowered.includes("private") ||
    lowered.includes("forbidden") ||
    lowered.includes("not available") ||
    lowered.includes("unavailable") ||
    lowered.includes("접근") ||
    lowered.includes("비공개") ||
    lowered.includes("제한")
  );
}

type Props = {
  mapId?: string; // ✅ 추가: map 단위 썸네일 저장 경로에 사용

  initial: {
    sourceUrl?: string;
    title?: string;
    channelName?: string;
    thumbnailUrl?: string;
    tags?: string[];
    description?: string;
  };
  onClose: () => void;
  onSave: (meta: Meta) => void;

  isProcessing?: boolean;
  processingTitle?: string;
  processingMessage?: string;
  processingBullets?: string[];
};

export default function MetadataDialog({
  mapId,
  initial,
  onClose,
  onSave,
  isProcessing: _isProcessing = false,
  processingTitle,
  processingMessage,
  processingBullets: _processingBullets = [],
}: Props) {
  const t = useTranslations("MetadataDialog");
  const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl ?? "");
  const [sourceType, setSourceType] = useState<"youtube" | "manual" | null>(() => {
    const initialSourceUrl = initial.sourceUrl ?? "";
    if (!initialSourceUrl) return null;
    return isYouTubeUrl(initialSourceUrl) ? "youtube" : "manual";
  });
  const [title, setTitle] = useState(initial.title ?? "");
  const [channelName, setChannelName] = useState(initial.channelName ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnailUrl ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tagItems, setTagItems] = useState<string[]>(normalizeTags(initial.tags ?? []));
  const [tagComposing, setTagComposing] = useState(false);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [description, setDescription] = useState(initial.description ?? "");

  const [titleError, setTitleError] = useState<string | null>(null);
  const [isFetchingYoutubeMeta, setIsFetchingYoutubeMeta] = useState(false);
  const [youtubeMetaError, setYoutubeMetaError] = useState<string | null>(null);

  // ✅ manual upload states
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [thumbUploadError, setThumbUploadError] = useState<string | null>(null);

  // ✅ 선택한 파일 미리보기 URL(Object URL)
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);

  const youtube = sourceType === "youtube";
  const [detailsExpanded, setDetailsExpanded] = useState(() => {
    const initialSourceUrl = initial.sourceUrl ?? "";
    const initialType = !initialSourceUrl
      ? null
      : isYouTubeUrl(initialSourceUrl)
        ? "youtube"
        : "manual";
    if (initialType === "manual") return true;
    if (initialType === "youtube") return true;
    return false;
  });
  const tagSuggestions = useMemo(() => {
    const term = tagInput.trim().toLowerCase();
    if (!term) return [];
    return allTags
      .filter((tag) => !tagItems.includes(tag))
      .filter((tag) => tag.toLowerCase().includes(term))
      .slice(0, 8);
  }, [allTags, tagInput, tagItems]);

  const tagPickerCandidates = useMemo(() => {
    const term = tagSearchTerm.trim().toLowerCase();
    return allTags
      .filter((tag) => !tagItems.includes(tag))
      .filter((tag) => (term ? tag.toLowerCase().includes(term) : true));
  }, [allTags, tagItems, tagSearchTerm]);

  const clearManualUploadState = () => {
    setThumbFile(null);
    setThumbUploadError(null);
    if (thumbPreviewUrl) URL.revokeObjectURL(thumbPreviewUrl);
    setThumbPreviewUrl(null);
  };

  const fetchYoutubeMeta = async () => {
    if (!youtube) return;
    setYoutubeMetaError(null);
    setIsFetchingYoutubeMeta(true);

    try {
      const url = sourceUrl.trim();
      if (!url) throw new Error(t("errors.youtubeUrlRequired"));

      const supabase = createClient();
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        throw new Error(t("errors.sessionFailed", { message: sessionErr.message }));
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error(t("errors.loginRequired"));
      }

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error(t("errors.missingApiBase"));
      }

      const res = await fetch(`${base}/youtube-scripts/meta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ youtubeUrl: url }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.message || json?.error || t("errors.youtubeFetchFailed");
        throw new Error(
          typeof msg === "string" ? msg : msg?.[0] || t("errors.requestFailed")
        );
      }

      if (json?.title) setTitle(String(json.title));
      if (json?.channelName) setChannelName(String(json.channelName));
      if (json?.thumbnailUrl) setThumbnailUrl(String(json.thumbnailUrl));
      if (json?.description) setDescription(String(json.description));

      if (Array.isArray(json?.tags) && json.tags.length > 0) {
        setTagItems(normalizeTags(json.tags));
      }

      // ✅ 유튜브 자동 채우기를 성공하면 "수동 업로드 상태"는 해제 (충돌 방지)
      clearManualUploadState();
      setDetailsExpanded(true);
    } catch (error: unknown) {
      const message = getErrorMessage(error, t("errors.youtubeFetchFailed"));
      setYoutubeMetaError(
        looksLikeRestrictedYoutubeError(message)
          ? t("errors.youtubeRestricted")
          : message
      );
    } finally {
      setIsFetchingYoutubeMeta(false);
    }
  };

  useEffect(() => {
    if (titleError && title.trim()) setTitleError(null);
  }, [title, titleError]);

  useEffect(() => {
    if (sourceType === "manual") {
      setDetailsExpanded(true);
      return;
    }

    if (sourceType === "youtube") {
      setDetailsExpanded(true);
      return;
    }

    if (sourceType !== "youtube") {
      setDetailsExpanded(false);
      return;
    }
  }, [sourceType]);

  useEffect(() => {
    setTagItems(normalizeTags(initial.tags ?? []));
  }, [initial.tags]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/maps/tags?limit=200", {
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        const names = Array.isArray(json?.tags)
          ? json.tags
              .map((tag: { name?: string }) => tag?.name)
              .filter((name: unknown): name is string => Boolean(name))
          : [];
        setAllTags(names);
      } catch {
        if (!cancelled) setAllTags([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddTag = () => {
    const next = tagInput.trim();
    if (!next) return;
    setTagItems((prev) => normalizeTags([...prev, next]));
    setTagInput("");
  };

  // ✅ Object URL 정리
  useEffect(() => {
    return () => {
      if (thumbPreviewUrl) URL.revokeObjectURL(thumbPreviewUrl);
    };
  }, [thumbPreviewUrl]);

  const handlePickThumbFile = (file: File | null) => {
    if (!file) return;

    try {
      validateImageFile(file, 5);
      setThumbUploadError(null);
      setThumbFile(file);

      // preview URL 교체
      if (thumbPreviewUrl) URL.revokeObjectURL(thumbPreviewUrl);
      const preview = URL.createObjectURL(file);
      setThumbPreviewUrl(preview);

      // UI에는 preview 표시
      setThumbnailUrl(preview);
    } catch (error: unknown) {
      setThumbUploadError(getErrorMessage(error, t("errors.invalidImage")));
      setThumbFile(null);
    }
  };

  const requireTitle = () => {
    const v = title.trim();
    if (!v) {
      setTitleError(t("errors.titleRequired"));
      return false;
    }
    return true;
  };

  const handleTryClose = () => {
    onClose();
  };

  const uploadThumbnailToSupabase = async (file: File) => {
    setThumbUploadError(null);
    setIsUploadingThumb(true);

    try {
      // ✅ 저장 시 업로드인데 mapId가 없으면 업로드 불가
      if (!mapId) {
        throw new Error(t("errors.missingMapId"));
      }

      validateImageFile(file, 5);

      const supabase = createClient();
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        throw new Error(t("errors.loginRequired"));
      }

      // ✅ 리사이즈 + webp 변환
      const webp = await resizeToWebp(file, { maxWidth: 1280, quality: 0.82 });

      // ✅ mapId 기준 경로 + 같은 path 덮어쓰기
      const objectPath = `${user.id}/maps/${mapId}/thumbnail.webp`;

      const { error: uploadErr } = await supabase.storage
        .from("thumbnails")
        .upload(objectPath, webp, {
          upsert: true,
          contentType: "image/webp",
          cacheControl: "3600",
        });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from("thumbnails").getPublicUrl(objectPath);
      return data.publicUrl;
    } catch (error: unknown) {
      setThumbUploadError(
        getErrorMessage(error, t("errors.thumbnailUploadFailed"))
      );
      throw error;
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const handleSave = async () => {
    if (!requireTitle()) return;

    let finalThumbUrl = thumbnailUrl.trim() || undefined;

    // ✅ 핵심 조건: "수동 업로드(파일 선택)"인 경우에만 Storage 업로드 실행
    if (thumbFile) {
      try {
        const publicUrl = await uploadThumbnailToSupabase(thumbFile);
        finalThumbUrl = publicUrl;

        // preview -> 실제 URL로 교체
        setThumbnailUrl(publicUrl);
        clearManualUploadState();
      } catch {
        // 업로드 실패 시 저장 중단
        return;
      }
    }
    const meta: Meta = {
      sourceUrl: sourceUrl.trim() || undefined,
      title: title.trim(),
      channelName: channelName.trim() || undefined,
      thumbnailUrl: finalThumbUrl,
      tags: tagItems,
      description: description.trim() || undefined,
    };

    onSave(meta);
  };

  const titleCounter = `${title.trim().length}/200`;
  const isBusy = isFetchingYoutubeMeta || isUploadingThumb;

  return (
      <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/65"
        onClick={handleTryClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="
            relative overflow-hidden
            w-full max-w-2xl
            rounded-3xl
            bg-white/98 border border-slate-400
            shadow-[0_26px_90px_-40px_rgba(15,23,42,0.9)]
            max-h-[85vh]
            flex flex-col

            dark:bg-[#111C2E]
            dark:border-white/30
            dark:ring-1 dark:ring-white/20
            dark:shadow-[0_38px_140px_-70px_rgba(0,0,0,0.95)]
          "
          onKeyDownCapture={(event) => event.stopPropagation()}
        >
          <div
            className="
              pointer-events-none absolute inset-0
              bg-[radial-gradient(900px_280px_at_20%_0%,rgba(59,130,246,0.16),transparent_60%)]
              dark:bg-[radial-gradient(900px_280px_at_20%_0%,rgba(56,189,248,0.16),transparent_60%)]
            "
          />
          <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />

          {/* header */}
          <div
            className="
              relative
              px-5 md:px-6 py-4
              border-b border-slate-400 dark:border-white/30
              flex items-center justify-between
              sticky top-0 z-10
              bg-white/90 dark:bg-[#111C2E]/92
            "
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="
                  h-9 w-9 rounded-2xl
                  bg-blue-600 text-white flex items-center justify-center
                  dark:bg-[rgb(var(--hero-b))]
                  shadow-sm
                  flex-shrink-0
                "
              >
                <Icon icon="mdi:information-outline" className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-blue-700 dark:text-[rgb(var(--hero-b))]">
                  {processingTitle ?? t("title")}
                </p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 break-words">
                  {processingMessage ?? t("subtitle")}
                </p>
              </div>
            </div>

            <button
              onClick={handleTryClose}
              className="rounded-full p-1.5 text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white flex-shrink-0"
              aria-label="close"
              disabled={isUploadingThumb}
            >
              <Icon icon="mdi:close" className="h-5 w-5" />
            </button>
          </div>

          {/* body */}
          <div
            className="
              relative px-5 md:px-6 py-5 grid gap-4
              overflow-y-auto
              overflow-x-hidden
            "
          >
            {sourceType === null ? (
              <div className="grid gap-2 min-w-0">
                <label className="text-[17px] font-bold text-neutral-800 dark:text-neutral-100">
                  {t("fields.sourceQuestion")}
                </label>
                <p className="text-[14px] leading-6 text-neutral-600 dark:text-white/65">
                  {t("hints.youtubeOptional")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSourceType("youtube");
                      setDetailsExpanded(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-400 bg-white px-4 py-3 text-[15px] font-bold text-neutral-800 transition hover:bg-neutral-50 dark:border-white/30 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    <Icon icon="mdi:youtube" className="h-6 w-6 flex-shrink-0 text-[#FF0000]" />
                    {t("fields.sourceTypeYes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceType("manual");
                      setDetailsExpanded(true);
                    }}
                    className="rounded-2xl border border-slate-400 bg-white px-4 py-3 text-[15px] font-bold text-neutral-800 transition hover:bg-neutral-50 dark:border-white/30 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    {t("fields.sourceTypeNo")}
                  </button>
                </div>
              </div>
            ) : null}

            {/* URL */}
            {sourceType === "youtube" ? (
            <div className="grid gap-1.5 min-w-0">
              <label className="text-[17px] font-bold text-neutral-800 dark:text-neutral-100">
                {t("fields.url")}
              </label>
              <p className="text-[14px] leading-6 text-neutral-600 dark:text-white/65">
                {t("hints.youtubeUrl")}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder={t("placeholders.url")}
                  className="
                    w-full min-w-0
                    rounded-2xl border border-slate-400 bg-neutral-50
                    px-3 py-2 text-sm
                    focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                    dark:border-white/30 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                  "
                />
                <button
                  type="button"
                  onClick={fetchYoutubeMeta}
                  disabled={!youtube || isFetchingYoutubeMeta}
                  className="
                    w-full sm:w-auto
                    rounded-2xl px-3 py-2 text-sm font-semibold
                    inline-flex items-center justify-center gap-2
                    text-white
                    bg-neutral-900 hover:bg-neutral-800
                    dark:bg-[rgb(var(--hero-b))] dark:hover:bg-[rgb(var(--hero-a))]
                    shadow-sm hover:shadow-md
                    transition-transform hover:scale-[1.02] active:scale-100
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40
                    dark:focus-visible:ring-[rgb(var(--hero-b))]/35
                    disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed
                    whitespace-nowrap
                  "
                >
                  {isFetchingYoutubeMeta ? t("buttons.youtubeLoading") : t("buttons.youtubeAutofill")}
                </button>
              </div>

              {youtubeMetaError && (
                <p className="text-[14px] leading-6 text-rose-600 dark:text-rose-300 break-words">
                  {youtubeMetaError}
                </p>
              )}

              <p className="text-[13px] leading-6 text-neutral-500 dark:text-white/55">
                {t("hints.youtubeSkip")}
              </p>

            </div>
            ) : null}

            {detailsExpanded ? (
              <>
                {/* Title + Channel */}
                <div className="grid md:grid-cols-2 gap-3 min-w-0">
                  <div className="grid gap-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <label className="text-[17px] font-bold text-neutral-800 dark:text-neutral-100">
                        {t("fields.title")} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[14px] font-semibold text-neutral-500 dark:text-white/60 flex-shrink-0">
                        {titleCounter}
                      </span>
                    </div>

                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                      placeholder={t("placeholders.title")}
                      className={`
                        w-full min-w-0
                        rounded-2xl border bg-neutral-50 px-3 py-2.5 text-[15px]
                        focus:outline-none focus:ring-2
                        dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                        ${
                          titleError
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-300/50 dark:border-rose-500/50"
                            : "border-slate-400 focus:border-blue-400 focus:ring-blue-300/60 dark:border-white/30"
                        }
                      `}
                    />
                    {titleError && (
                      <p className="text-[15px] leading-6 font-medium text-rose-600 dark:text-rose-300 break-words">
                        {titleError}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-1.5 min-w-0">
                    <label className="text-[17px] font-bold text-neutral-800 dark:text-neutral-100">
                      {t("fields.channel")}
                    </label>
                    <input
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder={t("placeholders.channel")}
                      className="
                        w-full min-w-0
                        rounded-2xl border border-slate-400 bg-neutral-50
                        px-3 py-2.5 text-[15px]
                        focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                        dark:border-white/30 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                      "
                    />
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="grid gap-1.5 min-w-0">
                  <label className="text-[17px] font-bold text-neutral-800 dark:text-neutral-100">
                    {t("fields.thumbnail")}
                  </label>

                  <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-center">
                    <div
                      className="
                        h-16 w-28 rounded-2xl overflow-hidden
                        border border-slate-400 bg-neutral-50
                        dark:border-white/30 dark:bg-white/5
                        flex-shrink-0
                      "
                    >
                      {thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnailUrl}
                          alt="thumbnail"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[14px] font-medium text-neutral-400 dark:text-white/40">
                          {t("thumbnail.empty")}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 grid gap-2 min-w-0">
                      <input
                        value={thumbnailUrl}
                        onChange={(e) => {
                          setThumbnailUrl(e.target.value);
                          clearManualUploadState();
                        }}
                        placeholder={t("placeholders.thumbnailUrl")}
                        className="
                          w-full min-w-0
                          rounded-2xl border border-slate-400 bg-neutral-50
                          px-3 py-2.5 text-[15px]
                          focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                          dark:border-white/30 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                        "
                      />

                      <div className="flex flex-col items-start gap-2 min-w-0 sm:flex-row sm:items-center">
                        <label
                          className="
                            inline-flex max-w-full items-center gap-2 cursor-pointer
                            rounded-2xl px-3 py-2.5 text-[15px] font-bold
                            border border-slate-400 bg-white hover:bg-neutral-50
                            dark:border-white/30 dark:bg-white/6 dark:text-white dark:hover:bg-white/10
                            whitespace-normal break-words
                          "
                        >
                          <Icon icon="mdi:upload" className="h-4 w-4" />
                          <span className="min-w-0 break-words">
                            {t("buttons.uploadThumbnail")}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handlePickThumbFile(e.target.files?.[0] ?? null)
                            }
                          />
                        </label>

                        {isUploadingThumb && (
                          <span className="text-[15px] font-medium text-neutral-500 break-words dark:text-white/60">
                            {t("status.uploading")}
                          </span>
                        )}
                      </div>

                      {thumbUploadError && (
                        <p className="text-[15px] leading-6 font-medium text-rose-600 dark:text-rose-300 break-words">
                          {thumbUploadError}
                        </p>
                      )}

                      {thumbFile && !thumbUploadError && (
                        <p className="text-[15px] leading-6 font-medium text-neutral-500 dark:text-white/60 break-words">
                          {t("thumbnail.uploadHint")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="grid gap-1.5 min-w-0">
                  <label className="text-[17px] font-bold text-neutral-800 dark:text-neutral-100">
                    {t("fields.tags")}
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-400 bg-neutral-50 px-3 py-2.5 text-[15px] text-neutral-900 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-300/60 dark:border-white/30 dark:bg-white/5 dark:text-white dark:focus-within:border-white dark:focus-within:ring-white/20">
                      {tagItems.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-400 bg-white px-3 py-1.5 text-[15px] font-semibold text-neutral-700 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/85"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() =>
                              setTagItems((prev) => prev.filter((item) => item !== tag))
                            }
                            className="text-neutral-400 hover:text-neutral-700 dark:text-white/50 dark:hover:text-white"
                            aria-label={t("tags.removeTagAria")}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onCompositionStart={() => setTagComposing(true)}
                        onCompositionEnd={() => setTagComposing(false)}
                        onKeyDown={(e) => {
                          if (tagComposing || e.nativeEvent.isComposing) return;
                          if (e.key !== "Enter" && e.key !== ",") return;
                          e.preventDefault();
                          handleAddTag();
                        }}
                        placeholder={t("tags.addTagPlaceholder")}
                        className="min-w-[140px] flex-1 border-0 bg-transparent px-0 py-0 text-[16px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white dark:placeholder:text-white/40"
                      />
                    </div>

                    <p className="text-[14px] font-medium text-neutral-500 dark:text-white/60">
                      {t("tags.enterHint")}
                    </p>

                    {tagSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tagSuggestions.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setTagItems((prev) =>
                                normalizeTags(prev.includes(tag) ? prev : [...prev, tag])
                              )
                            }
                            className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 text-[14px] font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setTagPickerOpen((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 text-[16px] font-bold text-blue-700 hover:text-blue-800 dark:text-[rgb(var(--hero-b))] dark:hover:text-[rgb(var(--hero-a))]"
                      >
                        {t("tags.addFromExisting")}
                        <Icon
                          icon="mdi:chevron-down"
                          className={`h-4.5 w-4.5 transition-transform ${tagPickerOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      <span className="text-[15px] font-semibold text-neutral-500 dark:text-white/50">
                        {t("tags.selectedCount", { count: tagItems.length })}
                      </span>
                    </div>

                    {tagPickerOpen && (
                      <div className="rounded-2xl border border-slate-400 bg-white p-3 text-[15px] text-neutral-700 shadow-sm dark:border-white/30 dark:bg-white/[0.08] dark:text-white/80">
                        <input
                          value={tagSearchTerm}
                          onChange={(e) => setTagSearchTerm(e.target.value)}
                          placeholder={t("tags.searchPlaceholder")}
                          className="w-full rounded-full border border-slate-400 bg-white px-3 py-2.5 text-[16px] text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-white/30 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-white/40 dark:focus:border-white"
                        />
                        <div className="mt-2 max-h-40 overflow-y-auto">
                          <div className="flex flex-wrap gap-2">
                            {tagPickerCandidates.length === 0 ? (
                              <span className="text-[15px] font-medium text-neutral-400 dark:text-white/50">
                                {t("tags.noTagsToAdd")}
                              </span>
                            ) : (
                              tagPickerCandidates.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() =>
                                    setTagItems((prev) => normalizeTags([...prev, tag]))
                                  }
                                  className="rounded-full border border-slate-400 bg-white px-3 py-1.5 text-[15px] text-neutral-700 hover:bg-neutral-100 dark:border-white/30 dark:bg-white/[0.08] dark:text-white/80 dark:hover:bg-white/10"
                                >
                                  #{tag}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="grid gap-1.5 min-w-0">
                  <label className="text-[17px] font-bold text-neutral-800 dark:text-neutral-100">
                    {t("fields.description")}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("placeholders.description")}
                    className="
                      w-full min-w-0
                      min-h-[110px] resize-y rounded-2xl
                      border border-slate-400 bg-neutral-50
                      px-3 py-2.5 text-[15px] placeholder:text-[15px]
                      focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                      dark:border-white/30 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                    "
                  />
                </div>
              </>
            ) : null}
          </div>

          {/* footer */}
          <div
            className="
              relative
              px-5 md:px-6 py-4
              border-t border-slate-400 dark:border-white/30
              sticky bottom-0 z-10
              bg-white/90 dark:bg-[#111C2E]/92
            "
          >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <button
              onClick={handleTryClose}
              disabled={isBusy}
              className="
                w-full sm:w-auto sm:ml-auto
                rounded-2xl border border-slate-400 bg-white px-4 py-3 text-[15px] font-bold text-neutral-800
                hover:bg-neutral-100
                dark:border-white/20 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/10
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {t("buttons.close")}
            </button>

            <button
              onClick={handleSave}
              disabled={isBusy}
                className="
                  w-full sm:w-auto
                  rounded-2xl px-4 py-3 text-[15px] font-bold text-white
                  bg-blue-600 hover:bg-blue-700
                  shadow-[0_12px_30px_-18px_rgba(37,99,235,0.9)]
                  dark:bg-[rgb(var(--hero-b))] dark:text-[#081120] dark:hover:bg-[rgb(var(--hero-a))]
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
            >
              {isUploadingThumb ? t("status.uploading") : t("buttons.save")}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
