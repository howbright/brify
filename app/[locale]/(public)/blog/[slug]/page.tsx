import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getBlogPostByLocaleAndSlug } from "@/app/lib/blog";
import ZoomableImage from "@/components/blog/ZoomableImage";

type Params = { locale: string; slug: string };
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  return {
    title: `${post.title} | Brify`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  const post = await getBlogPostByLocaleAndSlug(locale, slug);

  if (!post) {
    redirect(`/${locale}/blog`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-28 md:px-10 md:pt-32">
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
