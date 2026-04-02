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

type Props = {
  mapId?: string;
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
  saving?: boolean;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function normalizeTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(
    0,
    12
  );
}

export default function MapMetadataEditDialog({
  mapId,
  initial,
  onClose,
  onSave,
  saving = false,
}: Props) {
  const t = useTranslations("MetadataDialog");
  const tEdit = useTranslations("MapMetadataEditDialog");

  const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl ?? "");
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
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [thumbUploadError, setThumbUploadError] = useState<string | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const isBusy = saving || isUploadingThumb;

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

  useEffect(() => {
    if (titleError && title.trim()) setTitleError(null);
  }, [title, titleError]);

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

  useEffect(() => {
    return () => {
      if (thumbPreviewUrl) URL.revokeObjectURL(thumbPreviewUrl);
    };
  }, [thumbPreviewUrl]);

  const clearManualUploadState = () => {
    setThumbFile(null);
    setThumbUploadError(null);
    if (thumbPreviewUrl) URL.revokeObjectURL(thumbPreviewUrl);
    setThumbPreviewUrl(null);
  };

  const handleAddTag = () => {
    const next = tagInput.trim();
    if (!next) return;
    setTagItems((prev) => normalizeTags([...prev, next]));
    setTagInput("");
  };

  const handlePickThumbFile = (file: File | null) => {
    if (!file) return;

    try {
      validateImageFile(file, 5);
      setThumbUploadError(null);
      setThumbFile(file);

      if (thumbPreviewUrl) URL.revokeObjectURL(thumbPreviewUrl);
      const preview = URL.createObjectURL(file);
      setThumbPreviewUrl(preview);
      setThumbnailUrl(preview);
    } catch (error: unknown) {
      setThumbUploadError(getErrorMessage(error, t("errors.invalidImage")));
      setThumbFile(null);
    }
  };

  const requireTitle = () => {
    const value = title.trim();
    if (!value) {
      setTitleError(t("errors.titleRequired"));
      return false;
    }
    return true;
  };

  const uploadThumbnailToSupabase = async (file: File) => {
    setThumbUploadError(null);
    setIsUploadingThumb(true);

    try {
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

      const webp = await resizeToWebp(file, { maxWidth: 1280, quality: 0.82 });
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
    if (thumbFile) {
      try {
        const publicUrl = await uploadThumbnailToSupabase(thumbFile);
        finalThumbUrl = publicUrl;
        setThumbnailUrl(publicUrl);
        clearManualUploadState();
      } catch {
        return;
      }
    }

    onSave({
      sourceUrl: sourceUrl.trim() || undefined,
      title: title.trim(),
      channelName: channelName.trim() || undefined,
      thumbnailUrl: finalThumbUrl,
      tags: tagItems,
      description: description.trim() || undefined,
    });
  };

  const titleCounter = `${title.trim().length}/200`;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/65"
        onClick={isBusy ? undefined : onClose}
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
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_280px_at_20%_0%,rgba(59,130,246,0.16),transparent_60%)] dark:bg-[radial-gradient(900px_280px_at_20%_0%,rgba(56,189,248,0.16),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />

          <div
            className="
              relative px-5 md:px-6 py-4
              border-b border-slate-400 dark:border-white/30
              flex items-center justify-between
              sticky top-0 z-10
              bg-white/90 dark:bg-[#111C2E]/92
            "
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center dark:bg-[rgb(var(--hero-b))] shadow-sm flex-shrink-0">
                <Icon icon="mdi:pencil" className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-blue-700 dark:text-[rgb(var(--hero-b))]">
                  {tEdit("title")}
                </p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 break-words">
                  {tEdit("subtitle")}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white flex-shrink-0"
              aria-label={t("buttons.close")}
              disabled={isBusy}
            >
              <Icon icon="mdi:close" className="h-5 w-5" />
            </button>
          </div>

          <div className="relative px-5 md:px-6 py-5 grid gap-4 overflow-y-auto overflow-x-hidden">
            <div className="grid gap-1.5 min-w-0">
              <label className="text-[14px] font-bold text-neutral-800 dark:text-white">
                {t("fields.url")}
              </label>
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={t("placeholders.url")}
                className="w-full min-w-0 rounded-2xl border border-slate-400 bg-neutral-50 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60 dark:border-white/30 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[14px] font-bold text-neutral-800 dark:text-white">
                  {t("fields.title")}
                </label>
                <span className="text-[12px] font-medium text-neutral-400 dark:text-white/40">
                  {titleCounter}
                </span>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                placeholder={t("placeholders.title")}
                className={`rounded-2xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 ${
                  titleError
                    ? "border-rose-400 focus:border-rose-400 focus:ring-rose-300/60 dark:border-rose-400/70 dark:focus:ring-rose-400/30"
                    : "border-slate-400 focus:border-blue-400 focus:ring-blue-300/60 dark:border-white/30"
                }`}
              />
              {titleError ? (
                <p className="text-sm text-rose-600 dark:text-rose-300">
                  {titleError}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <label className="text-[14px] font-bold text-neutral-800 dark:text-white">
                {t("fields.channel")}
              </label>
              <input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value.slice(0, 120))}
                placeholder={t("placeholders.channel")}
                className="rounded-2xl border border-slate-400 bg-white px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60 dark:border-white/30 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-[14px] font-bold text-neutral-800 dark:text-white">
                {t("fields.thumbnail")}
              </label>
              <div className="overflow-hidden rounded-2xl border border-slate-400 bg-neutral-50 dark:border-white/30 dark:bg-white/5">
                <div className="flex items-start gap-3 p-3">
                  <div className="h-[72px] w-[128px] shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-white/10">
                    {thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-neutral-400 dark:text-white/35">
                        {t("thumbnail.empty")}
                      </div>
                    )}
                  </div>
                  <div className="grid min-w-0 flex-1 gap-2">
                    <input
                      value={thumbFile ? "" : thumbnailUrl}
                      onChange={(e) => {
                        clearManualUploadState();
                        setThumbnailUrl(e.target.value);
                      }}
                      placeholder={t("placeholders.thumbnailUrl")}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60 dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
                    />
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                      <Icon icon="mdi:image-plus-outline" className="h-4 w-4" />
                      {t("buttons.uploadThumbnail")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePickThumbFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
                <div className="px-3 pb-3">
                  <p className="text-[11px] leading-5 text-neutral-400 dark:text-white/35">
                    {t("thumbnail.uploadHint")}
                  </p>
                  {thumbUploadError ? (
                    <p className="text-sm text-rose-600 dark:text-rose-300">
                      {thumbUploadError}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-[14px] font-bold text-neutral-800 dark:text-white">
                {t("fields.tags")}
              </label>

              <div className="flex flex-wrap gap-2">
                {tagItems.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      aria-label={t("tags.removeTagAria")}
                      onClick={() =>
                        setTagItems((prev) => prev.filter((item) => item !== tag))
                      }
                    >
                      <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onCompositionStart={() => setTagComposing(true)}
                  onCompositionEnd={() => setTagComposing(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !tagComposing) {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder={t("tags.addTagPlaceholder")}
                  className="min-w-[180px] flex-1 rounded-2xl border border-slate-400 bg-white px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60 dark:border-white/30 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded-2xl border border-slate-400 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 dark:border-white/30 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <Icon icon="mdi:plus" className="mr-1 inline h-4 w-4" />
                  {t("tags.addTagPlaceholder")}
                </button>
                <button
                  type="button"
                  onClick={() => setTagPickerOpen((prev) => !prev)}
                  className="rounded-2xl border border-slate-400 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 dark:border-white/30 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <Icon icon="mdi:tag-multiple-outline" className="mr-1 inline h-4 w-4" />
                  {t("tags.addFromExisting")}
                </button>
              </div>

              <p className="text-[12px] text-neutral-500 dark:text-white/45">
                {t("tags.enterHint")}
              </p>

              {tagSuggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tagSuggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setTagItems((prev) => normalizeTags([...prev, tag]));
                        setTagInput("");
                      }}
                      className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              ) : null}

              {tagPickerOpen ? (
                <div className="rounded-2xl border border-slate-300 bg-white p-3 dark:border-white/20 dark:bg-white/5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-neutral-800 dark:text-white">
                      {t("tags.addFromExisting")}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-neutral-400 dark:text-white/40">
                        {t("tags.selectedCount", { count: tagItems.length })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setTagPickerOpen(false)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-800 dark:border-white/20 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                        aria-label={tEdit("buttons.closeTagPicker")}
                        title={tEdit("buttons.closeTagPicker")}
                      >
                        <Icon icon="mdi:close" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <input
                    value={tagSearchTerm}
                    onChange={(e) => setTagSearchTerm(e.target.value)}
                    placeholder={t("tags.searchPlaceholder")}
                    className="mb-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60 dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
                  />
                  {tagPickerCandidates.length > 0 ? (
                    <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                      {tagPickerCandidates.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setTagItems((prev) => normalizeTags([...prev, tag]))
                          }
                          className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-500 dark:text-white/45">
                      {t("tags.noTagsToAdd")}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="grid gap-1.5 min-w-0">
              <label className="text-[14px] font-bold text-neutral-800 dark:text-white">
                {t("fields.description")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1200))}
                placeholder={t("placeholders.description")}
                rows={6}
                className="min-h-[140px] rounded-2xl border border-slate-400 bg-white px-3 py-2.5 text-sm leading-6 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60 dark:border-white/30 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
              />
            </div>
          </div>

          <div className="relative px-5 md:px-6 py-4 border-t border-slate-400 dark:border-white/30 bg-white/90 dark:bg-[#111C2E]/92 flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-500 dark:text-white/45">
              {tEdit("footerHint")}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="rounded-2xl border border-slate-400 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60 dark:border-white/30 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                {t("buttons.close")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isBusy}
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 dark:bg-[rgb(var(--hero-b))] dark:hover:brightness-110"
              >
                {isBusy ? t("status.uploading") : tEdit("buttons.save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
