import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogPostsByLocale } from "@/app/lib/blog";

type Params = { locale: string };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  return {
    title: isKo ? "브라이피 블로그 | Brify" : "Brify Blog",
    description: isKo
      ? "복잡한 정보를 마인드맵으로 구조화하는 방법을 다루는 Brify 블로그입니다."
      : "Brify blog on turning complex information into structured mind maps.",
  };
}

export default async function BlogPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const isKo = locale === "ko";
  const posts = await getBlogPostsByLocale(locale);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-28 md:px-10 md:pt-32">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-white">
          {isKo ? "Brify 블로그" : "Brify Blog"}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {isKo ? `총 ${posts.length}개의 글` : `${posts.length} posts`}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/${locale}/blog/${post.slug}`}
            prefetch={false}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-slate-900"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            </div>
            <div className="space-y-2 p-4">
              <h2 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                {post.title}
              </h2>
              <p className="line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {post.excerpt}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
