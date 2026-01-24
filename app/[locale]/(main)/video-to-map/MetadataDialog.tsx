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
  onClose: () => void; // ✅ "닫기"는 이제 '제목이 있을 때만' 허용됩니다.
  onSave: (meta: Meta) => void;

  // ✅ 처리 상태 표시용 (A안)
  isProcessing?: boolean;
  processingTitle?: string;
  processingMessage?: string;
  processingBullets?: string[]; // (현재 UI에서는 기본 미표시)
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

  const [titleError, setTitleError] = useState<string | null>(null);

  const youtube = useMemo(() => isYouTubeUrl(sourceUrl), [sourceUrl]);

  // ✅ 프로토타입: 유튜브 URL이면 “자동 추출 모킹”
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
    if (youtube) mockFetchYouTubeMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtube]);

  // ✅ 제목 수정 시 에러 해제
  useEffect(() => {
    if (titleError && title.trim()) setTitleError(null);
  }, [title, titleError]);

  const handlePickThumbFile = (file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setThumbnailUrl(url);
  };

  const requireTitle = () => {
    const v = title.trim();
    if (!v) {
      setTitleError("제목은 필수 항목입니다. 제목을 입력해 주세요.");
      return false;
    }
    return true;
  };

  // ✅ 닫기는 "제목이 있을 때만" 허용
  const handleTryClose = () => {
    if (!requireTitle()) return;
    onClose();
  };

  const handleSave = () => {
    if (!requireTitle()) return;

    const meta: Meta = {
      sourceUrl: sourceUrl.trim() || undefined,
      title: title.trim(),
      channelName: channelName.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      tags: splitTags(tagInput),
      description: description.trim() || undefined,
    };

    onSave(meta);
  };

  const titleCounter = `${title.trim().length}/80`;

  return (
    <div className="fixed inset-0 z-50">
      {/* ✅ backdrop: 다크에서 살짝 더 진하게(카드 분리감 ↑) */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/65"
        onClick={handleTryClose}
      />

      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="
            relative overflow-hidden
            w-full max-w-2xl
            rounded-3xl
            bg-white/98 border border-neutral-200
            shadow-[0_26px_90px_-40px_rgba(15,23,42,0.9)]
            overflow-hidden
            max-h-[85vh]
            flex flex-col

            /* ✅ dark: '페이지 배경'보다 확실히 밝은 surface + ring + 큰 그림자 */
            dark:bg-[#111C2E]
            dark:border-white/10
            dark:ring-1 dark:ring-white/10
            dark:shadow-[0_38px_140px_-70px_rgba(0,0,0,0.95)]
          "
        >
          {/* ✅ 표면감(상단 하이라이트) */}
          <div
            className="
              pointer-events-none absolute inset-0
              bg-[radial-gradient(900px_280px_at_20%_0%,rgba(59,130,246,0.16),transparent_60%)]
              dark:bg-[radial-gradient(900px_280px_at_20%_0%,rgba(56,189,248,0.16),transparent_60%)]
            "
          />
          <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />

          {/* header (sticky) */}
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
            <div className="flex items-center gap-2">
              <div
                className="
                  h-9 w-9 rounded-2xl
                  bg-blue-600 text-white flex items-center justify-center
                  dark:bg-[rgb(var(--hero-b))]
                  shadow-sm
                "
              >
                <Icon icon="mdi:information-outline" className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">
                  콘텐츠 정보 입력
                </p>
                <p className="text-xs text-neutral-500 dark:text-white/60">
                  제목은 필수이며, 나머지는 선택입니다.
                </p>
              </div>
            </div>

            <button
              onClick={handleTryClose}
              className="
                rounded-xl p-2
                hover:bg-neutral-100 dark:hover:bg-white/10
              "
              aria-label="close"
            >
              <Icon icon="mdi:close" className="h-5 w-5" />
            </button>
          </div>

          {/* ✅ compact processing status */}
          {isProcessing && (
            <div
              className="
                relative
                px-5 md:px-6 py-3
                border-b border-neutral-200/70 dark:border-white/10
                bg-blue-50/70 dark:bg-white/[0.06]
              "
            >
              <div className="flex items-center gap-2">
                <div
                  className="
                    h-7 w-7 flex items-center justify-center rounded-full
                    bg-neutral-900 text-white text-[11px] font-semibold
                    dark:bg-white dark:text-neutral-900
                  "
                >
                  AI
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-neutral-900 dark:text-white leading-snug">
                    {processingTitle ?? "구조맵을 생성하고 있습니다"}
                  </p>
                  <p className="text-[12px] text-neutral-600 dark:text-white/70 truncate">
                    {processingMessage ?? "처리 중입니다"}
                    <span className="inline-flex gap-0.5 ml-1">
                      <span className="animate-pulse">.</span>
                      <span className="animate-pulse delay-150">.</span>
                      <span className="animate-pulse delay-300">.</span>
                    </span>
                  </p>

                  {/* height 방지: bullets는 개발용 숨김 */}
                  {process.env.NODE_ENV === "development" &&
                    processingBullets.length > 0 && (
                      <span className="hidden">
                        {processingBullets.join(",")}
                      </span>
                    )}
                </div>

                {/* ✅ 진행바: 튀는 색 + 대비 강화 */}
                <div className="w-28 md:w-40">
                  <div className="h-2 rounded-full bg-blue-200/80 dark:bg-white/10 overflow-hidden">
                    <div
                      className="
                        h-full w-1/2 rounded-full
                        bg-[linear-gradient(90deg,#3b82f6,#22c55e,#a855f7)]
                        animate-[pulse_1.2s_ease-in-out_infinite]
                      "
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* body (scroll) */}
          <div className="relative px-5 md:px-6 py-5 grid gap-4 overflow-y-auto">
            {/* URL */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
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
                    focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                    dark:border-white/12 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
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
                    dark:border-white/12 dark:bg-white/6 dark:text-white dark:hover:bg-white/10
                  "
                >
                  유튜브 자동추출(모킹)
                </button>
              </div>

              {youtube ? (
                <p className="text-[11px] text-neutral-500 dark:text-white/60">
                  유튜브 URL이라면 제목/채널/썸네일을 자동으로 채울 수 있습니다.
                </p>
              ) : (
                <p className="text-[11px] text-neutral-500 dark:text-white/60">
                  유튜브 URL이 아니라면 아래 항목을 직접 입력해 주세요.
                </p>
              )}
            </div>

            {/* Title + Channel */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                    제목 <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-neutral-500 dark:text-white/60">
                    {titleCounter}
                  </span>
                </div>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  placeholder="예: 창세기 강해 1강"
                  className={`
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
                  <p className="text-[12px] text-rose-600 dark:text-rose-300">
                    {titleError}
                  </p>
                )}
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                  채널/출처 (선택)
                </label>
                <input
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="예: OO교회 / OO강사"
                  className="
                    rounded-2xl border border-neutral-200 bg-neutral-50
                    px-3 py-2 text-sm
                    focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                    dark:border-white/12 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                  "
                />
              </div>
            </div>

            {/* Thumbnail */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                썸네일 (선택)
              </label>

              <div className="flex items-center gap-3">
                <div
                  className="
                    h-16 w-28 rounded-2xl overflow-hidden
                    border border-neutral-200 bg-neutral-50
                    dark:border-white/12 dark:bg-white/5
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

                <div className="flex-1 grid gap-2">
                  <input
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="(선택) 썸네일 URL"
                    className="
                      rounded-2xl border border-neutral-200 bg-neutral-50
                      px-3 py-2 text-sm
                      focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                      dark:border-white/12 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                    "
                  />
                  <div className="flex items-center gap-2">
                    <label
                      className="
                        inline-flex items-center gap-2 cursor-pointer
                        rounded-2xl px-3 py-2 text-sm font-semibold
                        border border-neutral-200 bg-white hover:bg-neutral-50
                        dark:border-white/12 dark:bg-white/6 dark:text-white dark:hover:bg-white/10
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
                    <span className="text-[11px] text-neutral-500 dark:text-white/60">
                      프로토타입: 로컬 미리보기만 지원합니다.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                태그 (선택)
              </label>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="예: 설교, 창세기, 제자훈련 (쉼표로 구분)"
                className="
                  rounded-2xl border border-neutral-200 bg-neutral-50
                  px-3 py-2 text-sm
                  focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                  dark:border-white/12 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
                "
              />
              <p className="text-[11px] text-neutral-500 dark:text-white/60">
                쉼표로 구분해 입력하시면 태그로 저장됩니다.
              </p>
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                설명 (선택)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 구조맵에 대한 메모/요약/설명 등을 입력해 주세요."
                className="
                  min-h-[110px] resize-y rounded-2xl
                  border border-neutral-200 bg-neutral-50
                  px-3 py-2 text-sm
                  focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                  dark:border-white/12 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40
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
              flex items-center justify-end gap-2
              sticky bottom-0 z-10
              bg-white/90 dark:bg-[#111C2E]/92
              backdrop-blur-md
            "
          >
            <div className="mr-auto text-[11px] text-neutral-500 dark:text-white/60">
              제목 입력 후 저장하시면 구조맵 목록에서 관리하실 수 있습니다.
            </div>

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
