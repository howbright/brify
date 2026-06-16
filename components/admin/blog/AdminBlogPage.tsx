"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

type BlogLocale = "ko" | "en" | "fr";
type BlogStatus = "draft" | "published";

type BlogPostAdmin = {
  id: string;
  locale: BlogLocale;
  slug: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  markdown: string | null;
  status: BlogStatus;
  published_at: string | null;
  translation_group_id: string | null;
  created_at: string;
  updated_at: string;
};

type BlogTranslationResponse = {
  translationGroupId?: string;
  results?: Array<{
    locale: BlogLocale | string;
    status: "created" | "updated" | string;
    post: BlogPostAdmin;
  }>;
};

type FormState = {
  id: string | null;
  locale: BlogLocale;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  markdown: string;
  status: BlogStatus;
  publishedAt: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  locale: "ko",
  slug: "",
  title: "",
  excerpt: "",
  imageUrl: "",
  markdown: "",
  status: "draft",
  publishedAt: "",
};

function normalizeBlogLocale(value: string | undefined): BlogLocale {
  if (value === "ko" || value === "en" || value === "fr") return value;
  return "ko";
}

function getEmptyForm(locale: BlogLocale): FormState {
  return { ...EMPTY_FORM, locale };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toPublishedAtPayload(value: string, status: BlogStatus) {
  if (status !== "published") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function toForm(post: BlogPostAdmin): FormState {
  return {
    id: post.id,
    locale: post.locale,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? "",
    imageUrl: post.image_url ?? "",
    markdown: post.markdown ?? "",
    status: post.status,
    publishedAt: toDatetimeLocal(post.published_at),
  };
}

function getUploadErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "이미지 업로드에 실패했어요.";
  }

  const payload = error as {
    error?: string;
    message?: string;
    maxMb?: number;
  };

  if (payload.error === "TOO_LARGE") {
    return `이미지가 너무 커요. ${payload.maxMb ?? 20}MB 이하 파일을 업로드해 주세요.`;
  }
  if (payload.error === "IMAGE_ONLY") {
    return "GIF, PNG, JPG, WEBP 이미지만 업로드할 수 있어요.";
  }
  if (payload.error === "FILE_REQUIRED") {
    return "업로드할 이미지 파일을 선택해 주세요.";
  }
  if (payload.error === "unauthorized") {
    return "관리자 로그인 후 다시 시도해 주세요.";
  }
  if (payload.error === "STORAGE_UPLOAD_FAILED" && payload.message) {
    return `스토리지 업로드에 실패했어요: ${payload.message}`;
  }
  if (payload.message) {
    return payload.message;
  }

  return "이미지 업로드에 실패했어요.";
}

export default function AdminBlogPage() {
  const params = useParams<{ locale?: string }>();
  const locale = normalizeBlogLocale(params?.locale);
  const [posts, setPosts] = useState<BlogPostAdmin[]>([]);
  const [form, setForm] = useState<FormState>(() => getEmptyForm(locale));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftIdea, setDraftIdea] = useState("");
  const [draftSlugHint, setDraftSlugHint] = useState("");
  const [translationResults, setTranslationResults] = useState<BlogTranslationResponse["results"]>([]);
  const [lastUploadedImageUrl, setLastUploadedImageUrl] = useState("");
  const [localeFilter, setLocaleFilter] = useState<"all" | BlogLocale>("all");

  const filteredPosts = useMemo(
    () => posts.filter((post) => localeFilter === "all" || post.locale === localeFilter),
    [posts, localeFilter]
  );

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog", { credentials: "include" });
      if (!res.ok) throw new Error("블로그 목록을 불러오지 못했어요.");
      const json = await res.json();
      setPosts(Array.isArray(json.posts) ? json.posts : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "블로그 목록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug || slugify(value),
    }));
  };

  const handleUpload = async (file: File | null, mode: "cover" | "body") => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("locale", form.locale);
    setUploading(true);
    try {
      const res = await fetch("/api/admin/blog/images", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) throw new Error(getUploadErrorMessage(json));
      const url = String(json.url);
      setLastUploadedImageUrl(url);
      if (mode === "cover") {
        updateForm("imageUrl", url);
      } else {
        setForm((prev) => ({
          ...prev,
          markdown: `${prev.markdown.trimEnd()}\n\n![blog image](${url})\n`,
        }));
      }
      toast.success("이미지를 업로드했어요.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "이미지 업로드에 실패했어요.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const cleanTitle = form.title.trim();
    const cleanSlug = form.slug.trim();
    const cleanExcerpt = form.excerpt.trim();
    const cleanMarkdown = form.markdown.trim();

    if (!cleanTitle) {
      toast.error("제목을 입력해 주세요.");
      return;
    }
    if (!cleanSlug) {
      toast.error("slug를 입력해 주세요.");
      return;
    }
    if (!cleanExcerpt) {
      toast.error("요약을 입력해 주세요. 검색 결과 설명에도 쓰입니다.");
      return;
    }
    if (!cleanMarkdown) {
      toast.error("본문을 입력해 주세요.");
      return;
    }

    setSaving(true);
    try {
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/blog", {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title: cleanTitle,
          slug: cleanSlug,
          excerpt: cleanExcerpt,
          markdown: cleanMarkdown,
          publishedAt: toPublishedAtPayload(form.publishedAt, form.status),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          json.error === "INVALID_SLUG"
            ? "slug는 영문 소문자, 숫자, 하이픈만 가능해요."
            : json.error === "DUPLICATE_SLUG"
              ? "같은 언어에 이미 같은 slug가 있어요."
              : "저장에 실패했어요.";
        throw new Error(message);
      }
      const next = json.post as BlogPostAdmin;
      setPosts((prev) => {
        const exists = prev.some((post) => post.id === next.id);
        return exists
          ? prev.map((post) => (post.id === next.id ? next : post))
          : [next, ...prev];
      });
      setForm(toForm(next));
      toast.success("블로그 글을 저장했어요.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPostAdmin) => {
    if (!window.confirm(`"${post.title}" 글을 삭제할까요?`)) return;
    try {
      const res = await fetch(`/api/admin/blog?id=${encodeURIComponent(post.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("삭제에 실패했어요.");
      setPosts((prev) => prev.filter((item) => item.id !== post.id));
      if (form.id === post.id) setForm(getEmptyForm(locale));
      toast.success("삭제했어요.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "삭제에 실패했어요.");
    }
  };

  const handleGenerateKoreanDraft = async () => {
    const idea = draftIdea.trim();
    const slugHint = slugify(draftSlugHint.trim());

    if (idea.length < 20) {
      toast.error("아이디어를 조금 더 적어 주세요. 최소 20자 이상 필요해요.");
      return;
    }

    setGeneratingDraft(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았어요.");
      }

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("관리자 세션을 찾지 못했어요. 다시 로그인해 주세요.");
      }

      const res = await fetch(`${baseUrl}/admin/blog-posts/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ idea, slugHint }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          res.status === 401
            ? "인증이 만료되었어요. 다시 로그인해 주세요."
            : res.status === 403
              ? "관리자 권한이 필요해요."
              : json.error === "IDEA_TOO_SHORT" || json.message === "IDEA_TOO_SHORT"
                ? "아이디어를 조금 더 적어 주세요."
                : json.error === "IDEA_TOO_LONG" || json.message === "IDEA_TOO_LONG"
                  ? `아이디어가 너무 길어요. 8000자 이하로 줄여 주세요.`
                  : json.error === "INVALID_KOREAN_DRAFT_PAYLOAD" ||
                      json.message === "INVALID_KOREAN_DRAFT_PAYLOAD"
                    ? "초안 형식이 올바르지 않아 저장하지 않았어요."
                    : json.error || json.message || "한국어 초안 생성에 실패했어요.";
        throw new Error(message);
      }

      const next = json.post as BlogPostAdmin;
      setPosts((prev) => [next, ...prev.filter((post) => post.id !== next.id)]);
      setForm(toForm(next));
      setLocaleFilter("ko");
      setDraftIdea("");
      setDraftSlugHint("");
      toast.success("한국어 블로그 초안을 draft로 저장했어요.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "한국어 초안 생성에 실패했어요.");
    } finally {
      setGeneratingDraft(false);
    }
  };

  const mergePosts = (nextPosts: BlogPostAdmin[]) => {
    setPosts((prev) => {
      const byId = new Map(prev.map((post) => [post.id, post]));
      nextPosts.forEach((post) => byId.set(post.id, post));
      return Array.from(byId.values()).sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  };

  const handleGenerateTranslations = async (targetLocales: BlogLocale[]) => {
    if (!form.id) {
      toast.error("먼저 글을 저장한 뒤 번역 초안을 생성해 주세요.");
      return;
    }

    setTranslating(true);
    setTranslationResults([]);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았어요.");
      }

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("관리자 세션을 찾지 못했어요. 다시 로그인해 주세요.");
      }

      const response = await fetch(`${baseUrl}/admin/blog-posts/${form.id}/translations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetLocales,
          overwrite: true,
        }),
      });

      const json = (await response.json().catch(() => ({}))) as BlogTranslationResponse & {
        message?: string;
        error?: string;
      };

      if (response.status === 401) {
        throw new Error("인증이 만료되었어요. 다시 로그인해 주세요.");
      }
      if (response.status === 403) {
        throw new Error("관리자 권한이 필요해요.");
      }
      if (!response.ok) {
        throw new Error(json.error || json.message || "번역 초안 생성에 실패했어요.");
      }

      const nextResults = Array.isArray(json.results) ? json.results : [];
      const nextPosts = nextResults.map((item) => item.post).filter(Boolean);
      if (nextPosts.length > 0) mergePosts(nextPosts);
      setTranslationResults(nextResults);
      toast.success("번역 초안을 생성했어요.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "번역 초안 생성에 실패했어요.");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={`/${locale}/admin`} className="text-sm font-semibold text-blue-700">
              Admin
            </Link>
            <h1 className="mt-2 text-3xl font-black tracking-tight">블로그 관리</h1>
            <p className="mt-1 text-sm text-slate-600">
              Markdown으로 글을 작성하고 언어별 published 글만 공개 블로그에 노출합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(getEmptyForm(locale))}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm"
          >
            <Icon icon="mdi:plus" className="h-4 w-4" />
            새 글
          </button>
        </header>

        <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black tracking-tight">아이디어로 한국어 블로그 초안 만들기</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                대략의 생각만 적으면 한국어 글을 draft로 저장합니다. 저장된 초안은 바로 아래 편집기에서 다듬을 수 있어요.
              </p>
            </div>
            <button
              type="button"
              disabled={generatingDraft || saving || uploading}
              onClick={() => void handleGenerateKoreanDraft()}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon
                icon={generatingDraft ? "mdi:loading" : "mdi:auto-fix"}
                className={`h-4 w-4 ${generatingDraft ? "animate-spin" : ""}`}
              />
              {generatingDraft ? "초안 생성 중" : "초안 생성"}
            </button>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
            <label className="flex flex-col gap-1 text-sm font-bold">
              블로그 아이디어
              <textarea
                value={draftIdea}
                onChange={(event) => setDraftIdea(event.target.value)}
                rows={5}
                className="rounded-xl border border-slate-300 px-3 py-2 font-medium leading-6"
                placeholder={"예: 논문을 많이 읽는 연구자에게 요약보다 구조맵이 필요한 이유. NotebookLM 마인드맵과의 차이, 원문찾기의 중요성, Brify가 전문 문서를 다루는 방식까지 자연스럽게 설명해줘."}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-bold">
              Slug 힌트
              <input
                value={draftSlugHint}
                onChange={(event) => setDraftSlugHint(slugify(event.target.value))}
                className="rounded-xl border border-slate-300 px-3 py-2 font-medium"
                placeholder="research-paper-structure-map"
              />
              <span className="text-xs font-medium leading-5 text-slate-500">
                비워두면 AI가 영어 slug를 제안하고, 중복되면 자동으로 번호를 붙입니다.
              </span>
            </label>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black">글 목록</h2>
              <select
                value={localeFilter}
                onChange={(event) => setLocaleFilter(event.target.value as "all" | BlogLocale)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold"
              >
                <option value="all">ALL</option>
                <option value="ko">KO</option>
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
            </div>
            <div className="flex max-h-[calc(100vh-190px)] flex-col gap-2 overflow-y-auto pr-1">
              {loading ? (
                <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-500">불러오는 중...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-500">아직 글이 없어요.</div>
              ) : (
                filteredPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => setForm(toForm(post))}
                    className={`rounded-xl border p-3 text-left transition ${
                      form.id === post.id
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-500">
                      <span>{post.locale}</span>
                      <span className={post.status === "published" ? "text-emerald-600" : "text-amber-600"}>
                        {post.status}
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm font-bold">{post.title}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">/{post.slug}</div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm font-bold">
                언어
                <select
                  value={form.locale}
                  onChange={(event) => updateForm("locale", event.target.value as BlogLocale)}
                  className="rounded-xl border border-slate-300 px-3 py-2 font-medium"
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-bold">
                상태
                <select
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value as BlogStatus)}
                  className="rounded-xl border border-slate-300 px-3 py-2 font-medium"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-bold">
                공개 시간
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(event) => updateForm("publishedAt", event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 font-medium"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-bold">
                제목
                <input
                  value={form.title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 font-medium"
                  placeholder="블로그 제목"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-bold">
                Slug
                <input
                  value={form.slug}
                  onChange={(event) => updateForm("slug", slugify(event.target.value))}
                  className="rounded-xl border border-slate-300 px-3 py-2 font-medium"
                  placeholder="long-text-to-structure-map"
                />
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-1 text-sm font-bold">
              요약
              <textarea
                value={form.excerpt}
                onChange={(event) => updateForm("excerpt", event.target.value)}
                rows={3}
                className="rounded-xl border border-slate-300 px-3 py-2 font-medium leading-6"
                placeholder="목록과 메타 description에 쓰일 짧은 설명"
              />
            </label>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
              <label className="flex flex-col gap-1 text-sm font-bold">
                대표 이미지 URL
                <input
                  value={form.imageUrl}
                  onChange={(event) => updateForm("imageUrl", event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 font-medium"
                  placeholder="https://..."
                />
              </label>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-50">
                <Icon icon="mdi:image-plus" className="h-4 w-4" />
                대표 업로드
                <input
                  type="file"
                  accept="image/gif,image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    void handleUpload(event.target.files?.[0] ?? null, "cover");
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-50">
                <Icon icon="mdi:file-image-plus" className="h-4 w-4" />
                본문 삽입
                <input
                  type="file"
                  accept="image/gif,image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    void handleUpload(event.target.files?.[0] ?? null, "body");
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
            {lastUploadedImageUrl ? (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-bold text-slate-700">최근 업로드 URL: </span>
                <code className="break-all">{lastUploadedImageUrl}</code>
              </div>
            ) : null}

            <label className="mt-4 flex flex-col gap-1 text-sm font-bold">
              Markdown 본문
              <span className="text-xs font-medium text-slate-500">
                이미지는 <code className="rounded bg-slate-100 px-1 py-0.5">![이미지 설명](이미지 URL)</code> 형식으로 넣어요.
                본문 삽입 버튼을 누르면 이 형식으로 자동 추가됩니다.
              </span>
              <textarea
                value={form.markdown}
                onChange={(event) => updateForm("markdown", event.target.value)}
                rows={20}
                className="min-h-[460px] rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm leading-6"
                placeholder={"## 소제목\n\n본문을 Markdown으로 작성하세요.\n\n![이미지 설명](https://...)"}
              />
            </label>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">외국어 번역 초안</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    저장된 글을 기준으로 NestJS 백엔드에서 영어/프랑스어 draft를 생성합니다. 기존 초안이 있으면 덮어씁니다.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!form.id || translating || saving || uploading}
                    onClick={() => void handleGenerateTranslations(["en"])}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon icon={translating ? "mdi:loading" : "mdi:translate"} className={`h-4 w-4 ${translating ? "animate-spin" : ""}`} />
                    영어 초안
                  </button>
                  <button
                    type="button"
                    disabled={!form.id || translating || saving || uploading}
                    onClick={() => void handleGenerateTranslations(["fr"])}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon icon={translating ? "mdi:loading" : "mdi:translate"} className={`h-4 w-4 ${translating ? "animate-spin" : ""}`} />
                    프랑스어 초안
                  </button>
                  <button
                    type="button"
                    disabled={!form.id || translating || saving || uploading}
                    onClick={() => void handleGenerateTranslations(["en", "fr"])}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon icon={translating ? "mdi:loading" : "mdi:translate-variant"} className={`h-4 w-4 ${translating ? "animate-spin" : ""}`} />
                    둘 다 생성
                  </button>
                </div>
              </div>
              {translationResults && translationResults.length > 0 ? (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {translationResults.map((result) => (
                    <button
                      key={`${result.locale}-${result.post.id}`}
                      type="button"
                      onClick={() => setForm(toForm(result.post))}
                      className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-left text-xs text-slate-600 shadow-sm hover:bg-blue-50"
                    >
                      <span className="font-black uppercase text-blue-700">{result.locale}</span>
                      <span className="ml-2 font-semibold">{result.status === "created" ? "생성됨" : "갱신됨"}</span>
                      <span className="mt-1 block truncate font-bold text-slate-900">{result.post.title}</span>
                      <span className="mt-1 block truncate">/{result.post.locale}/blog/{result.post.slug}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>공개 URL: /{form.locale}/blog/{form.slug || "slug"}</span>
                {form.status === "published" && form.slug ? (
                  <Link
                    href={`/${form.locale}/blog/${form.slug}`}
                    target="_blank"
                    className="rounded-full border border-slate-300 px-2 py-1 font-bold text-slate-700 hover:bg-slate-50"
                  >
                    공개 페이지 보기
                  </Link>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {form.id && (
                  <button
                    type="button"
                    onClick={() => {
                      const post = posts.find((item) => item.id === form.id);
                      if (post) void handleDelete(post);
                    }}
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50"
                  >
                    삭제
                  </button>
                )}
                <button
                  type="button"
                  disabled={saving || uploading}
                  onClick={() => void handleSubmit()}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-black text-white shadow-sm disabled:opacity-60"
                >
                  <Icon icon={saving ? "mdi:loading" : "mdi:content-save"} className={`h-4 w-4 ${saving ? "animate-spin" : ""}`} />
                  {saving ? "저장 중" : "저장"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
