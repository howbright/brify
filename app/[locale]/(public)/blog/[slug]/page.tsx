import type { Metadata } from "next";
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

function getOgLocale(locale: string) {
  if (locale === "ko") return "ko_KR";
  if (locale === "fr") return "fr_FR";
  return "en_US";
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
  const canonical = getPostUrl(post);
  const imageUrl = getImageUrl(post);
  const languageAlternates = Object.fromEntries(
    alternates.map((item) => [item.locale, getPostUrl(item)])
  );

  return {
    title: `${post.title} | Brify`,
    description: post.excerpt,
    keywords: post.seoKeywords,
    alternates: {
      canonical,
      languages: languageAlternates,
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
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
    </main>
  );
}
