import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations({ locale, namespace: "BlogPage.meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function BlogPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BlogPage" });
  const posts = await getBlogPostsByLocale(locale);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-28 md:px-10 md:pt-32">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t("count", { count: posts.length })}
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
