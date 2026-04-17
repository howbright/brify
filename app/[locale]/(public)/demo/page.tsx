import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import LanguageSelector from "@/components/LanguageSelector";
import { getSharedMapMetaByToken } from "@/app/lib/sharedMapMeta";

const DEMO_SHARE_TOKEN = "fca4a9b3-cd00-4230-8313-489246c3d634";

type DemoPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

function sourceTypeLabel(sourceType: string | null) {
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "website") return "웹페이지";
  if (sourceType === "file") return "파일";
  return "직접 입력";
}

function getDemoIntro(locale: string) {
  if (locale === "ko") {
    return {
      eyebrow: "왜 이 예시를 봐야 할까요",
      intro:
        "구조맵의 예시로 매우 유명한 TED 강의를 준비했습니다.",
      lead:
        "‘골든 서클(Golden Circle)’은 리더십과 브랜딩에서 가장 유명한 이론 중 하나입니다.",
      body1:
        "많은 사람들이 꼭 알아야 한다고 말하지만, 막상 영상을 끝까지 보기에는 시간이 부족하죠.",
      body2:
        "그래서 Brify를 만들었습니다.",
      body3:
        "유튜브 영상을 보지 않아도, 스크립트만 붙여넣으면 핵심 개념을 당신의 모국어로, 단 몇 분 만에 구조적으로 이해할 수 있습니다.",
    };
  }

  return {
    eyebrow: "Why this example matters",
    intro:
      "We prepared a well-known TED talk as a structure map example.",
    lead:
      "The Golden Circle is one of the most widely known ideas in leadership and branding.",
    body1:
      "People often say it is essential, but finding the time to watch the full video is not always easy.",
    body2:
      "That is why we built Brify.",
    body3:
      "Even without watching the YouTube video, you can paste in the script and understand the core ideas structurally in just a few minutes, in your own language.",
  };
}

export default async function DemoPage({ params }: DemoPageProps) {
  const { locale } = await params;
  const demo = await getSharedMapMetaByToken(DEMO_SHARE_TOKEN);
  const shareHref = `/${locale}/share/${DEMO_SHARE_TOKEN}`;
  const intro = getDemoIntro(locale);

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950 dark:bg-[#020617] dark:text-white">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:px-10 lg:px-12">
        <div className="flex justify-end">
          <LanguageSelector compact />
        </div>

        <section className="mx-auto mt-8 max-w-4xl text-center">
          <p className="text-sm font-semibold tracking-[0.18em] text-blue-700 dark:text-blue-300">
            DEMO
          </p>
          <h1 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl md:text-4xl dark:text-white">
            유명한 강연을 구조맵으로 읽어보세요
          </h1>
        </section>

        <section className="mx-auto mt-8 max-w-5xl">
          <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-7 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:px-8 sm:py-9 lg:px-10 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <p className="text-sm font-bold tracking-[-0.02em] text-blue-700 sm:text-base dark:text-blue-300">
              {intro.eyebrow}
            </p>
            <div className="mt-5 max-w-4xl space-y-5">
              <p className="text-lg font-semibold leading-8 text-slate-700 sm:text-xl dark:text-slate-200">
                {intro.intro}
              </p>
              <p className="text-lg font-semibold leading-8 text-slate-900 sm:text-[22px] dark:text-white">
                {intro.lead}
              </p>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
                {intro.body1}
              </p>
              <p className="text-base font-semibold leading-8 text-slate-900 dark:text-white">
                {intro.body2}
              </p>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
                {intro.body3}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] xl:gap-8">
          <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
              {demo?.thumbnailUrl ? (
                <Image
                  src={demo.thumbnailUrl}
                  alt={demo.youtubeTitle || demo.title || "YouTube thumbnail"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 380px"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#dbeafe,#f8fafc)] text-sm font-medium text-slate-500 dark:bg-[linear-gradient(135deg,#0f172a,#111827)] dark:text-slate-400">
                  썸네일이 없습니다
                </div>
              )}
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <Icon icon="mdi:youtube" className="h-4 w-4 text-red-500" />
                유튜브 예시
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  구조맵 제목
                </p>
                <h2 className="mt-2 text-xl font-bold leading-8 text-slate-950 dark:text-white">
                  {demo?.title || "데모 구조맵"}
                </h2>
              </div>

              <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.04]">
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    원본 유형
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {sourceTypeLabel(demo?.sourceType ?? null)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    채널명
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {demo?.channelName || "채널 정보 없음"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    유튜브 제목
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {demo?.youtubeTitle || demo?.title || "제목 정보 없음"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  요약
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {demo?.summary || demo?.description || "요약 정보가 없습니다."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  태그
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(demo?.tags ?? []).length > 0 ? (
                    demo?.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      태그 정보가 없습니다.
                    </span>
                  )}
                </div>
              </div>

              {demo?.sourceUrl ? (
                <Link
                  href={demo.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  원본 유튜브 보기
                  <Icon icon="mdi:open-in-new" className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </article>

          <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#07111f] dark:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Structure Map Preview
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                  구조맵 미리보기
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  이 예시는 미리보기용으로 고정된 화면입니다. 버튼을 눌러 구조맵을 직접 체험해보세요.
                </p>
              </div>
              <Link
                href={shareHref}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                크게 보기
                <Icon icon="mdi:arrow-top-right" className="h-4 w-4" />
              </Link>
            </div>

            <div className="p-4 sm:p-5">
              <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/45 to-transparent px-4 py-4 text-white">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      Preview
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      공유 구조맵을 축소해서 보여줍니다
                    </p>
                  </div>
                </div>

                <div className="relative h-[720px] overflow-hidden">
                  <iframe
                    src={shareHref}
                    title="Demo shared map preview"
                    className="pointer-events-none absolute left-0 top-0 h-[160%] w-[160%] origin-top-left scale-[0.625] border-0"
                  />
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
