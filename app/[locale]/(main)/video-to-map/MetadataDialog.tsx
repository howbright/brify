"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";

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

  // ✅ 처리 상태 표시용 (A안)
  isProcessing?: boolean;
  processingTitle?: string;
  processingMessage?: string;
  processingBullets?: string[]; // 현재 UI에서는 높이 문제로 기본 미표시
};

export default function MetadataDialog({
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

  const youtube = useMemo(() => isYouTubeUrl(sourceUrl), [sourceUrl]);

  const mockFetchYouTubeMeta = () => {
    const mock = {
      title: "【Mock】유튜브 영상 제목이 자동으로 입력됩니다",
      channelName: "【Mock】Channel Name",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    };
    if (!title) setTitle(mock.title);
    if (!channelName) setChannelName(mock.channelName);
    if (!thumbnailUrl) setThumbnailUrl(mock.thumbnailUrl);
  };

  useEffect(() => {
    if (youtube) {
      mockFetchYouTubeMeta();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtube]);

  const handlePickThumbFile = (file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setThumbnailUrl(url);
  };

  const handleSave = () => {
    const meta: Meta = {
      sourceUrl: sourceUrl.trim() || undefined,
      title: (title || "").trim() || "Untitled",
      channelName: channelName.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      tags: splitTags(tagInput),
      description: description.trim() || undefined,
    };
    onSave(meta);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="
            w-full max-w-2xl
            rounded-3xl
            bg-white/98 border border-neutral-200
            shadow-[0_26px_90px_-40px_rgba(15,23,42,0.9)]

            /* ✅ 다크모드: 카드 표면 톤 업 */
            dark:bg-[#0b1220]
            dark:border-white/12
            dark:shadow-[0_28px_110px_-50px_rgba(0,0,0,0.8)]

            overflow-hidden
            max-h-[85vh]
            flex flex-col
            relative
          "
        >
          {/* subtle highlight layer */}
          <div className="pointer-events-none absolute inset-0 bg-white/0 dark:bg-white/[0.03]" />

          {/* header (sticky) */}
          <div
            className="
              relative
              px-5 md:px-6 py-4
              border-b border-neutral-200 dark:border-white/10
              flex items-center justify-between
              sticky top-0 z-10
              bg-white/98 dark:bg-[#0b1220]
            "
          >
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <Icon icon="mdi:information-outline" className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">
                  콘텐츠 정보 입력
                </p>
                <p className="text-xs text-neutral-500 dark:text-white/60">
                  구조맵 생성이 진행되는 동안 미리 입력해 주세요
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-white/10"
              aria-label="close"
            >
              <Icon
                icon="mdi:close"
                className="h-5 w-5 text-neutral-900 dark:text-white"
              />
            </button>
          </div>

          {/* ✅ compact processing status (다크에서 대비 강화) */}
          {isProcessing && (
            <div className="relative px-5 md:px-6 py-3 border-b border-neutral-200/70 dark:border-white/10">
              {/* ✅ glow layer: 진행바만 '빛나는' 느낌 */}
              <div
                className="
        pointer-events-none absolute inset-0
        bg-[radial-gradient(700px_120px_at_15%_0%,rgba(59,130,246,0.28),transparent_60%),radial-gradient(700px_120px_at_85%_0%,rgba(99,102,241,0.22),transparent_60%)]
        dark:bg-[radial-gradient(700px_120px_at_15%_0%,rgba(59,130,246,0.22),transparent_60%),radial-gradient(700px_120px_at_85%_0%,rgba(99,102,241,0.18),transparent_60%)]
      "
              />

              {/* ✅ bar card */}
              <div
                className="
        relative rounded-2xl
        border border-blue-200/70 bg-blue-50/80
        shadow-[0_14px_40px_-28px_rgba(37,99,235,0.7)]
        px-3 py-2.5 flex items-center gap-2

        dark:border-[rgb(var(--hero-b))]/55
        dark:bg-[rgba(30,58,138,0.18)]
        dark:shadow-[0_18px_60px_-36px_rgba(59,130,246,0.55)]
      "
              >
                {/* AI badge */}
                <div
                  className="
          h-7 w-7 flex items-center justify-center rounded-full
          bg-blue-600 text-white text-[11px] font-semibold
          shadow-sm
          dark:bg-[rgb(var(--hero-b))]
        "
                >
                  AI
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-neutral-900 dark:text-white leading-snug">
                    {processingTitle ?? "구조맵을 생성하고 있습니다"}
                  </p>
                  <p className="text-[12px] text-neutral-700 dark:text-white/80 truncate">
                    {processingMessage ?? "처리 중입니다"}
                    <span className="inline-flex gap-0.5 ml-1">
                      <span className="animate-pulse">.</span>
                      <span className="animate-pulse delay-150">.</span>
                      <span className="animate-pulse delay-300">.</span>
                    </span>
                  </p>
                </div>

                {/* optional tiny pulse dot */}
                <span className="relative h-2 w-2 rounded-full bg-blue-500 dark:bg-[rgb(var(--hero-b))]">
                  <span className="absolute inset-0 rounded-full animate-ping bg-blue-400/70 dark:bg-[rgb(var(--hero-b))]/60" />
                </span>

                {/* dev용 숨김 유지 */}
                {process.env.NODE_ENV === "development" &&
                  processingBullets.length > 0 && (
                    <span className="hidden">
                      {processingBullets.join(",")}
                    </span>
                  )}
              </div>
            </div>
          )}

          {/* body (scroll) */}
          <div className="relative px-5 md:px-6 py-5 grid gap-4 overflow-y-auto">
            {/* URL */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-white/85">
                URL (선택)
              </label>
              <div className="flex gap-2">
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="
                    flex-1 rounded-2xl border border-neutral-200 bg-neutral-50
                    px-3 py-2 text-sm
                    dark:border-white/12 dark:bg-white/[0.04] dark:text-white
                    placeholder:text-neutral-400 dark:placeholder:text-white/35
                  "
                />
                <button
                  type="button"
                  onClick={mockFetchYouTubeMeta}
                  disabled={!youtube}
                  className="
                    rounded-2xl px-3 py-2 text-sm font-semibold
                    border border-neutral-200 bg-white hover:bg-neutral-50
                    disabled:opacity-40 disabled:cursor-not-allowed

                    dark:border-white/12
                    dark:bg-white/[0.04]
                    dark:hover:bg-white/[0.06]
                    dark:text-white
                  "
                >
                  유튜브 자동추출(모킹)
                </button>
              </div>
              {youtube ? (
                <p className="text-[11px] text-neutral-500 dark:text-white/55">
                  유튜브 URL이라면 제목/채널/썸네일을 자동으로 채울 수 있습니다.
                </p>
              ) : (
                <p className="text-[11px] text-neutral-500 dark:text-white/55">
                  유튜브 URL이 아니라면 아래 항목을 직접 입력해 주세요.
                </p>
              )}
            </div>

            {/* Title + Channel */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-white/85">
                  제목
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 창세기 강해 1강"
                  className="
                    rounded-2xl border border-neutral-200 bg-neutral-50
                    px-3 py-2 text-sm
                    dark:border-white/12 dark:bg-white/[0.04] dark:text-white
                    placeholder:text-neutral-400 dark:placeholder:text-white/35
                  "
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-white/85">
                  채널/출처
                </label>
                <input
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="예: OO교회 / OO강사"
                  className="
                    rounded-2xl border border-neutral-200 bg-neutral-50
                    px-3 py-2 text-sm
                    dark:border-white/12 dark:bg-white/[0.04] dark:text-white
                    placeholder:text-neutral-400 dark:placeholder:text-white/35
                  "
                />
              </div>
            </div>

            {/* Thumbnail */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-white/85">
                썸네일
              </label>

              <div className="flex items-center gap-3">
                <div
                  className="
                    h-16 w-28 rounded-2xl overflow-hidden
                    border border-neutral-200 bg-neutral-50
                    dark:border-white/12 dark:bg-white/[0.04]
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
                    <div className="h-full w-full flex items-center justify-center text-[11px] text-neutral-400 dark:text-white/35">
                      no image
                    </div>
                  )}
                </div>

                <div className="flex-1 grid gap-2">
                  <input
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="(선택) 썸네일 URL"
                    className="
                      rounded-2xl border border-neutral-200 bg-neutral-50
                      px-3 py-2 text-sm
                      dark:border-white/12 dark:bg-white/[0.04] dark:text-white
                      placeholder:text-neutral-400 dark:placeholder:text-white/35
                    "
                  />
                  <div className="flex items-center gap-2">
                    <label
                      className="
                        inline-flex items-center gap-2 cursor-pointer
                        rounded-2xl px-3 py-2 text-sm font-semibold
                        border border-neutral-200 bg-white hover:bg-neutral-50
                        dark:border-white/12 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]
                        dark:text-white
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
                    <span className="text-[11px] text-neutral-500 dark:text-white/55">
                      프로토타입: 로컬 미리보기만 지원합니다.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-white/85">
                태그
              </label>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="예: 설교, 창세기, 제자훈련 (쉼표로 구분)"
                className="
                  rounded-2xl border border-neutral-200 bg-neutral-50
                  px-3 py-2 text-sm
                  dark:border-white/12 dark:bg-white/[0.04] dark:text-white
                  placeholder:text-neutral-400 dark:placeholder:text-white/35
                "
              />
              <p className="text-[11px] text-neutral-500 dark:text-white/55">
                쉼표로 구분해 입력하시면 태그로 저장됩니다.
              </p>
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-white/85">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 구조맵에 대한 메모/요약/설명 등을 입력해 주세요."
                className="
                  min-h-[110px] resize-y rounded-2xl
                  border border-neutral-200 bg-neutral-50
                  px-3 py-2 text-sm
                  dark:border-white/12 dark:bg-white/[0.04] dark:text-white
                  placeholder:text-neutral-400 dark:placeholder:text-white/35
                "
              />
            </div>
          </div>

          {/* footer (sticky) */}
          <div
            className="
              relative
              px-5 md:px-6 py-4
              border-t border-neutral-200 dark:border-white/10
              flex justify-end gap-2
              sticky bottom-0 z-10
              bg-white/98 dark:bg-[#0b1220]
            "
          >
            <button
              onClick={onClose}
              className="
                rounded-2xl px-3.5 py-2 text-sm
                border border-neutral-300 bg-white hover:bg-neutral-100
                dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]
                dark:text-white
              "
            >
              나중에 입력하기
            </button>
            <button
              onClick={handleSave}
              className="
                rounded-2xl px-4 py-2 text-sm font-semibold text-white
                bg-blue-600 hover:bg-blue-700
                dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
              "
            >
              저장하고 계속하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
