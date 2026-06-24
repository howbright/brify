import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  getBlogPostByLocaleAndSlug,
  getPublishedBlogPostAlternates,
} from "@/app/lib/blog";
import type { BlogPost } from "@/app/lib/blog/types";
import ZoomableImage from "@/components/blog/ZoomableImage";

type Params = { locale: string; slug: string };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://www.brify.app";
const DEFAULT_OG_IMAGE = "/images/snsKo.jpg";

function getPostUrl(post: Pick<BlogPost, "locale" | "slug">) {
  return `/${post.locale}/blog/${post.slug}`;
}

function getAbsolutePostUrl(post: Pick<BlogPost, "locale" | "slug">) {
  return `${BASE_URL}${getPostUrl(post)}`;
}

function getAbsoluteBlogUrl(locale: string) {
  return `${BASE_URL}/${locale}/blog`;
}

function getOgLocale(locale: string) {
  if (locale === "ko") return "ko_KR";
  if (locale === "fr") return "fr_FR";
  return "en_US";
}

function getPostCta(locale: string) {
  if (locale === "ko") {
    return {
      title: "긴 자료를 구조맵으로 정리해보세요",
      description: "Brify는 논문, 문서, 영상 내용을 요약을 넘어 구조로 펼쳐서 읽을 수 있게 돕습니다.",
      primary: "AI 구조맵 만들기",
      secondary: "기능 보기",
    };
  }

  if (locale === "fr") {
    return {
      title: "Transformez vos longs contenus en carte structurelle",
      description:
        "Brify organise les articles, documents et vidéos pour que vous puissiez suivre la logique du contenu.",
      primary: "Créer une carte IA",
      secondary: "Voir les fonctionnalités",
    };
  }

  return {
    title: "Turn long material into a structure map",
    description:
      "Brify helps you organize papers, documents, and videos into a source-grounded structure you can actually navigate.",
    primary: "Create an AI map",
    secondary: "See features",
  };
}

function getImageUrl(post: BlogPost) {
  if (!post.imageUrl) return `${BASE_URL}${DEFAULT_OG_IMAGE}`;
  if (/^https?:\/\//i.test(post.imageUrl)) return post.imageUrl;
  return `${BASE_URL}${post.imageUrl.startsWith("/") ? post.imageUrl : `/${post.imageUrl}`}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPostByLocaleAndSlug(locale, slug);

  if (!post) {
    return {
      title:
        locale === "ko"
          ? "블로그 글을 찾을 수 없습니다 | Brify"
          : locale === "fr"
            ? "Article introuvable | Brify"
            : "Post not found | Brify",
    };
  }

  const alternates = await getPublishedBlogPostAlternates(post);
  const canonical = getAbsolutePostUrl(post);
  const imageUrl = getImageUrl(post);
  const languageAlternates = Object.fromEntries(
    alternates.map((item) => [item.locale, getAbsolutePostUrl(item)])
  );
  const defaultAlternate =
    alternates.find((item) => item.locale === "en") ?? alternates[0] ?? post;

  return {
    title: `${post.title} | Brify`,
    description: post.excerpt,
    keywords: post.seoKeywords,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical,
      languages: {
        ...languageAlternates,
        "x-default": getAbsolutePostUrl(defaultAlternate),
      },
    },
    openGraph: {
      type: "article",
      url: canonical,
      title: `${post.title} | Brify`,
      description: post.excerpt,
      siteName: "Brify",
      locale: getOgLocale(post.locale),
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | Brify`,
      description: post.excerpt,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  const post = await getBlogPostByLocaleAndSlug(locale, slug);

  if (!post) {
    redirect(`/${locale}/blog`);
  }

  const imageUrl = getImageUrl(post);
  const cta = getPostCta(post.locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        keywords: post.seoKeywords,
        image: imageUrl,
        url: getAbsolutePostUrl(post),
        mainEntityOfPage: getAbsolutePostUrl(post),
        datePublished: post.publishedAt ?? post.updatedAt,
        dateModified: post.updatedAt,
        inLanguage: post.locale,
        author: {
          "@type": "Organization",
          name: "Brify",
          url: BASE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: "Brify",
          url: BASE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${BASE_URL}/images/newlogo.png`,
          },
        },
        isPartOf: {
          "@type": "Blog",
          name: "Brify Blog",
          url: getAbsoluteBlogUrl(post.locale),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Brify",
            item: `${BASE_URL}/${post.locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: getAbsoluteBlogUrl(post.locale),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: getAbsolutePostUrl(post),
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-28 md:px-10 md:pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        {post.imageUrl ? (
          <div className="mb-6 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt={post.title} className="h-full w-full object-cover" />
          </div>
        ) : null}

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-slate-100">
          {post.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{post.excerpt}</p>

        <div className="mt-8">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="mt-10 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-8 text-xl font-semibold text-slate-900 dark:text-slate-100">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mt-5 text-[16px] leading-8 text-slate-700 dark:text-slate-200">{children}</p>
              ),
              ul: ({ children }) => <ul className="mt-5 list-disc space-y-2 pl-6 text-slate-700 dark:text-slate-200">{children}</ul>,
              ol: ({ children }) => <ol className="mt-5 list-decimal space-y-2 pl-6 text-slate-700 dark:text-slate-200">{children}</ol>,
              li: ({ children }) => <li className="leading-7">{children}</li>,
              img: ({ src, alt }) => (
                <ZoomableImage
                  src={typeof src === "string" ? src : ""}
                  alt={alt ?? "blog image"}
                  className="my-7 h-auto w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 object-cover dark:border-slate-700 dark:bg-slate-800/60"
                />
              ),
              blockquote: ({ children }) => (
                <blockquote className="mt-6 rounded-r-xl border-l-4 border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-slate-50">{children}</strong>,
            }}
          >
            {post.markdown}
          </ReactMarkdown>
        </div>

      </article>

      <section className="mt-14 border-t border-slate-200 pt-8 dark:border-slate-700">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {cta.title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {cta.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/${post.locale}/ai-mindmap-convert`}
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {cta.primary}
          </Link>
          <Link
            href={`/${post.locale}/features`}
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {cta.secondary}
          </Link>
        </div>
      </section>
    </main>
  );
}
