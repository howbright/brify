"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
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

function isYouTubeUrl(url: string) {
  const u = url.toLowerCase();
  return u.includes("youtube.com") || u.includes("youtu.be");
}

function splitTags(input: string) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
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
  isProcessing = false,
  processingTitle,
  processingMessage,
  processingBullets = [],
}: Props) {
  const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl ?? "");
  const [title, setTitle] = useState(initial.title ?? "");
  const [channelName, setChannelName] = useState(initial.channelName ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnailUrl ?? "");
  const [tagInput, setTagInput] = useState((initial.tags ?? []).join(", "));
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

  const youtube = useMemo(() => isYouTubeUrl(sourceUrl), [sourceUrl]);

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
      if (!url) throw new Error("유튜브 URL을 입력해 주세요.");

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
          json?.message || json?.error || "유튜브 정보를 가져오지 못했습니다.";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
      }

      if (json?.title) setTitle(String(json.title));
      if (json?.channelName) setChannelName(String(json.channelName));
      if (json?.thumbnailUrl) setThumbnailUrl(String(json.thumbnailUrl));
      if (json?.description) setDescription(String(json.description));

      if (Array.isArray(json?.tags) && json.tags.length > 0) {
        setTagInput(json.tags.slice(0, 12).join(", "));
      }

      // ✅ 유튜브 자동 채우기를 성공하면 "수동 업로드 상태"는 해제 (충돌 방지)
      clearManualUploadState();
    } catch (e: any) {
      setYoutubeMetaError(e?.message ?? "유튜브 정보를 가져오지 못했습니다.");
    } finally {
      setIsFetchingYoutubeMeta(false);
    }
  };

  useEffect(() => {
    if (titleError && title.trim()) setTitleError(null);
  }, [title, titleError]);

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
    } catch (e: any) {
      setThumbUploadError(e?.message ?? "이미지 파일이 올바르지 않습니다.");
      setThumbFile(null);
    }
  };

  const requireTitle = () => {
    const v = title.trim();
    if (!v) {
      setTitleError("제목은 필수 항목입니다. 제목을 입력해 주세요.");
      return false;
    }
    return true;
  };

  const handleTryClose = () => {
    if (!requireTitle()) return;
    onClose();
  };

  const uploadThumbnailToSupabase = async (file: File) => {
    setThumbUploadError(null);
    setIsUploadingThumb(true);

    try {
      // ✅ 저장 시 업로드인데 mapId가 없으면 업로드 불가
      if (!mapId) {
        throw new Error("mapId가 없어 썸네일을 업로드할 수 없습니다.");
      }

      validateImageFile(file, 5);

      const supabase = createClient();
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        throw new Error("로그인이 필요합니다.");
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
    } catch (e: any) {
      setThumbUploadError(e?.message ?? "썸네일 업로드에 실패했습니다.");
      throw e;
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
      tags: splitTags(tagInput),
      description: description.trim() || undefined,
    };

    onSave(meta);
  };

  const titleCounter = `${title.trim().length}/200`;
  const isBusy = isFetchingYoutubeMeta || isUploadingThumb;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/65"
        onClick={handleTryClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="
            relative overflow-hidden
            w-full max-w-2xl
            rounded-3xl
            bg-white/98 border border-neutral-200
            shadow-[0_26px_90px_-40px_rgba(15,23,42,0.9)]
            max-h-[85vh]
            flex flex-col

            dark:bg-[#111C2E]
            dark:border-white/10
            dark:ring-1 dark:ring-white/10
            dark:shadow-[0_38px_140px_-70px_rgba(0,0,0,0.95)]
          "
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
              border-b border-neutral-200/80 dark:border-white/10
              flex items-center justify-between
              sticky top-0 z-10
              bg-white/90 dark:bg-[#111C2E]/92
              backdrop-blur-md
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
                <p className="font-semibold text-neutral-900 dark:text-white">
                  콘텐츠 정보 입력
                </p>
                <p className="text-xs text-neutral-500 dark:text-white/60 break-words">
                  제목은 필수이며, 나머지는 선택입니다.
                </p>
              </div>
            </div>

            <button
              onClick={handleTryClose}
              className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-white/10 flex-shrink-0"
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
            {/* URL */}
            <div className="grid gap-1.5 min-w-0">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                URL (선택)
              </label>

              <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="
                    w-full min-w-0
                    rounded-2xl border border-neutral-200 bg-neutral-50
                    px-3 py-2 text-sm
                    focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                    dark:border-white/12 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
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
                  {isFetchingYoutubeMeta ? "불러오는 중..." : "유튜브로 자동 채우기"}
                </button>
              </div>

              {youtubeMetaError && (
                <p className="text-[12px] text-rose-600 dark:text-rose-300 break-words">
                  {youtubeMetaError}
                </p>
              )}

              <p className="text-[11px] text-neutral-500 dark:text-white/60 break-words">
                {youtube
                  ? "유튜브 URL이라면 제목/채널/썸네일을 자동으로 채울 수 있습니다."
                  : "유튜브 URL이 아니라면 아래 항목을 직접 입력해 주세요."}
              </p>
            </div>

            {/* Title + Channel */}
            <div className="grid md:grid-cols-2 gap-3 min-w-0">
              <div className="grid gap-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                    제목 <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-neutral-500 dark:text-white/60 flex-shrink-0">
                    {titleCounter}
                  </span>
                </div>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                  placeholder="예: 콘텐츠 제목을 입력해 주세요"
                  className={`
                    w-full min-w-0
                    rounded-2xl border bg-neutral-50 px-3 py-2 text-sm
                    focus:outline-none focus:ring-2
                    dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                    ${
                      titleError
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-300/50 dark:border-rose-500/50"
                        : "border-neutral-200 focus:border-blue-400 focus:ring-blue-300/60 dark:border-white/12"
                    }
                  `}
                />
                {titleError && (
                  <p className="text-[12px] text-rose-600 dark:text-rose-300 break-words">
                    {titleError}
                  </p>
                )}
              </div>

              <div className="grid gap-1.5 min-w-0">
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                  채널/출처 (선택)
                </label>
                <input
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="채널명 / 작성자 / 출처"
                  className="
                    w-full min-w-0
                    rounded-2xl border border-neutral-200 bg-neutral-50
                    px-3 py-2 text-sm
                    focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                    dark:border-white/12 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                  "
                />
              </div>
            </div>

            {/* Thumbnail */}
            <div className="grid gap-1.5 min-w-0">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                썸네일 (선택)
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                <div
                  className="
                    h-16 w-28 rounded-2xl overflow-hidden
                    border border-neutral-200 bg-neutral-50
                    dark:border-white/12 dark:bg-white/5
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
                    <div className="h-full w-full flex items-center justify-center text-[11px] text-neutral-400 dark:text-white/40">
                      no image
                    </div>
                  )}
                </div>

                <div className="flex-1 grid gap-2 min-w-0">
                  <input
                    value={thumbnailUrl}
                    onChange={(e) => {
                      setThumbnailUrl(e.target.value);
                      // URL 직접 수정하면 파일 업로드 상태는 해제(충돌 방지)
                      clearManualUploadState();
                    }}
                    placeholder="(선택) 썸네일 URL"
                    className="
                      w-full min-w-0
                      rounded-2xl border border-neutral-200 bg-neutral-50
                      px-3 py-2 text-sm
                      focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                      dark:border-white/12 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                    "
                  />

                  <div className="flex items-center gap-2 min-w-0">
                    <label
                      className="
                        inline-flex items-center gap-2 cursor-pointer
                        rounded-2xl px-3 py-2 text-sm font-semibold
                        border border-neutral-200 bg-white hover:bg-neutral-50
                        dark:border-white/12 dark:bg-white/6 dark:text-white dark:hover:bg-white/10
                        whitespace-nowrap
                      "
                    >
                      <Icon icon="mdi:upload" className="h-4 w-4" />
                      썸네일 업로드
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
                      <span className="text-[12px] text-neutral-500 dark:text-white/60">
                        업로드 중...
                      </span>
                    )}
                  </div>

                  {thumbUploadError && (
                    <p className="text-[12px] text-rose-600 dark:text-rose-300 break-words">
                      {thumbUploadError}
                    </p>
                  )}

                  {thumbFile && !thumbUploadError && (
                    <p className="text-[11px] text-neutral-500 dark:text-white/60 break-words">
                      선택한 이미지는 저장 시 자동 업로드됩니다. (5MB 이하, webp 변환)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="grid gap-1.5 min-w-0">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                태그 (선택)
              </label>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="회의, 마케팅, 기획, OKR (쉼표로 구분)"
                className="
                  w-full min-w-0
                  rounded-2xl border border-neutral-200 bg-neutral-50
                  px-3 py-2 text-sm
                  focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                  dark:border-white/12 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                "
              />
              <p className="text-[11px] text-neutral-500 dark:text-white/60 break-words">
                쉼표로 구분해 입력하시면 태그로 저장됩니다.
              </p>
            </div>

            {/* Description */}
            <div className="grid gap-1.5 min-w-0">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                설명 (선택)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 구조맵에 대한 메모/요약/설명 등을 입력해 주세요."
                className="
                  w-full min-w-0
                  min-h-[110px] resize-y rounded-2xl
                  border border-neutral-200 bg-neutral-50
                  px-3 py-2 text-sm
                  focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                  dark:border-white/12 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                "
              />
            </div>
          </div>

          {/* footer */}
          <div
            className="
              relative
              px-5 md:px-6 py-4
              border-t border-neutral-200 dark:border-white/10
              sticky bottom-0 z-10
              bg-white/90 dark:bg-[#111C2E]/92
              backdrop-blur-md
            "
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="text-[11px] text-neutral-500 dark:text-white/60 break-words">
                제목 입력 후 저장하시면 구조맵 목록에서 관리하실 수 있습니다.
              </div>

              <button
                onClick={handleSave}
                disabled={isBusy}
                className="
                  w-full sm:w-auto sm:ml-auto
                  rounded-2xl px-4 py-2 text-sm font-semibold text-white
                  bg-blue-600 hover:bg-blue-700
                  dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isUploadingThumb ? "업로드 중..." : "저장하고 계속하기"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
