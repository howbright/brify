"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import type { SlideItem } from "@/components/maps/mapSlideshow";

type MapSlideshowDialogProps = {
  open: boolean;
  slides: SlideItem[];
  onClose: () => void;
};

export default function MapSlideshowDialog({
  open,
  slides,
  onClose,
}: MapSlideshowDialogProps) {
  const [index, setIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setIndex(0);
      setSidebarOpen(false);
    }
  }, [open, slides]);

  const slide = slides[index] ?? null;
  const canGoPrev = index > 0;
  const canGoNext = index < slides.length - 1;
  const hasChildren = Boolean(slide?.children.length);
  const hasNodeDetail = Boolean(slide?.image || slide?.note);
  const isHighlighted = Boolean(slide?.highlightVariant);
  const isRecap = slide?.kind === "recap";

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        setIndex((prev) => Math.min(slides.length - 1, prev + 1));
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        setIndex(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        setIndex(Math.max(0, slides.length - 1));
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open, slides.length]);

  if (!open || !slide) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden bg-[#eef3f8] text-slate-950 dark:bg-[#070b12] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(235,242,248,0.86)_42%,rgba(213,227,238,0.72)_100%)] dark:bg-[linear-gradient(135deg,rgba(11,18,32,0.96)_0%,rgba(7,13,24,0.9)_48%,rgba(4,9,17,0.96)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,118,110,0.11)_0%,rgba(14,165,233,0.08)_33%,rgba(245,158,11,0.08)_67%,rgba(15,23,42,0.04)_100%)] dark:bg-[linear-gradient(90deg,rgba(34,211,238,0.13)_0%,rgba(163,230,53,0.07)_42%,rgba(250,204,21,0.07)_72%,rgba(255,255,255,0.03)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.26] [background-image:linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:56px_56px] dark:opacity-[0.16] dark:[background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-1.5 bg-[linear-gradient(90deg,#0f766e,#0ea5e9,#f59e0b,#f472b6)]" />

      <header className="relative flex min-h-14 items-center justify-between gap-3 border-b border-white/60 bg-white/62 px-4 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.72)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220]/68 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-[12px] font-extrabold shadow-sm transition-colors hover:text-slate-950 dark:text-white/80 dark:hover:text-white ${
              sidebarOpen
                ? "border-teal-300 bg-teal-50 text-teal-800 dark:border-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-100"
                : "border-slate-200 bg-white/88 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/8 dark:hover:bg-white/12"
            }`}
            aria-label="Open slide navigation"
            aria-expanded={sidebarOpen}
          >
            <Icon icon="mdi:format-list-bulleted-square" className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">Slides</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-white/55">
              <span>{index + 1} / {slides.length}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/30" />
              <span>Depth {slide.depth}</span>
            </div>
            <div className="mt-0.5 truncate text-[13px] font-medium text-slate-600 dark:text-white/65">
              {slide.path.join(" > ")}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Close slideshow"
        >
          <Icon icon="mdi:close" className="h-5 w-5" />
        </button>
      </header>

      <div
        className={`absolute inset-0 z-[2] bg-slate-950/18 backdrop-blur-[1px] transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`absolute bottom-16 left-0 top-14 z-[3] flex w-[min(86vw,340px)] flex-col border-r border-white/70 bg-white/76 shadow-[26px_0_80px_-56px_rgba(15,23,42,0.9)] backdrop-blur-2xl transition-transform duration-300 ease-out dark:border-white/10 dark:bg-[#0b1220]/82 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Slide navigation"
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 px-4 dark:border-white/10">
          <div className="min-w-0">
            <div className="text-xs font-extrabold uppercase text-slate-500 dark:text-white/55">
              Slides
            </div>
            <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {slides.length} items
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close slide navigation"
          >
            <Icon icon="mdi:chevron-left" className="h-5 w-5" />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <ol className="grid gap-2.5">
            {slides.map((item, itemIndex) => {
              const active = itemIndex === index;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(itemIndex)}
                    className={`group w-full rounded-2xl border p-3 text-left transition-colors ${
                      active
                        ? "border-teal-300 bg-white shadow-[0_16px_40px_-32px_rgba(15,118,110,0.82)] ring-2 ring-teal-200/60 dark:border-cyan-300/35 dark:bg-white/[0.09] dark:ring-cyan-300/18"
                        : item.kind === "recap"
                          ? "border-sky-300/70 bg-sky-50/82 hover:border-sky-400 dark:border-sky-200/25 dark:bg-sky-300/10"
                        : item.highlightVariant
                          ? "border-amber-300/70 bg-amber-50/80 hover:border-amber-400 dark:border-amber-200/25 dark:bg-amber-300/10"
                          : "border-slate-200/80 bg-white/54 hover:border-teal-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-cyan-300/25 dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-lg px-1.5 text-[11px] font-extrabold ${
                          active
                            ? "bg-teal-700 text-white dark:bg-cyan-300 dark:text-slate-950"
                            : item.highlightVariant
                              ? "bg-amber-400 text-amber-950"
                              : "bg-slate-900 text-white dark:bg-white/12 dark:text-white"
                        }`}
                      >
                        {itemIndex + 1}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400 dark:text-white/40">
                        {item.highlightVariant ? (
                          <Icon icon="mdi:marker" className="h-3.5 w-3.5 text-amber-500 dark:text-amber-200" />
                        ) : null}
                        {item.kind === "recap" ? (
                          <Icon icon="mdi:replay" className="h-3.5 w-3.5 text-sky-500 dark:text-sky-200" />
                        ) : null}
                        {item.image ? (
                          <Icon icon="mdi:image-outline" className="h-3.5 w-3.5" />
                        ) : null}
                        {item.note ? (
                          <Icon icon="mdi:comment-text-outline" className="h-3.5 w-3.5" />
                        ) : null}
                      </span>
                    </div>
                    <div className="line-clamp-2 text-[13px] font-bold leading-5 text-slate-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-white/50">
                      {item.kind === "recap" ? (
                        <>
                          <span className="text-sky-600 dark:text-sky-200">Recap</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/25" />
                        </>
                      ) : null}
                      <span>Depth {item.depth}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/25" />
                      <span>{item.children.length} children</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>

      <main className="relative min-h-0 flex-1 overflow-y-auto px-4 py-7 md:px-8 md:py-9">
        <section
          key={slide.id}
          className="brify-slide-stage mx-auto grid w-full max-w-4xl gap-5"
        >
          <div
            className={`brify-slide-card ${isHighlighted ? "brify-slide-highlight-card" : ""} rounded-2xl border bg-white/76 px-5 py-5 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.68)] backdrop-blur-2xl md:px-7 md:py-6 ${
              isHighlighted
                ? "border-amber-300/90 ring-2 ring-amber-300/55 dark:border-amber-200/35 dark:bg-[#171a20]/78 dark:ring-amber-300/25"
                : "border-white/80 ring-1 ring-slate-200/65 dark:border-white/10 dark:bg-[#101826]/72 dark:ring-white/10"
            }`}
          >
            <div className="brify-slide-kicker mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase text-teal-700 dark:text-cyan-300">
              <span className="inline-flex items-center gap-2">
                <Icon icon={isRecap ? "mdi:replay" : "mdi:map-marker-radius-outline"} className="h-4 w-4" />
                {isRecap ? "Recap" : "Current Node"}
              </span>
              {isRecap ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/70 bg-sky-100/85 px-2.5 py-1 text-[11px] font-extrabold text-sky-800 shadow-sm dark:border-sky-200/25 dark:bg-sky-300/12 dark:text-sky-100">
                  <Icon icon="mdi:format-list-checks" className="h-3.5 w-3.5" />
                  Summary
                </span>
              ) : null}
              {isHighlighted ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-100/85 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 shadow-sm dark:border-amber-200/25 dark:bg-amber-300/12 dark:text-amber-100">
                  <Icon icon="mdi:marker" className="h-3.5 w-3.5" />
                  Highlight
                </span>
              ) : null}
            </div>
            {slide.titleHtml ? (
              <h1
                className="brify-slide-title text-balance text-[24px] font-extrabold leading-snug tracking-normal text-slate-950 dark:text-white md:text-[32px]"
                dangerouslySetInnerHTML={{ __html: slide.titleHtml }}
              />
            ) : (
              <h1 className="brify-slide-title text-balance text-[24px] font-extrabold leading-snug tracking-normal text-slate-950 dark:text-white md:text-[32px]">
                {slide.title}
              </h1>
            )}

            {hasNodeDetail ? (
              <div
                className={`brify-slide-detail mt-5 grid gap-4 ${
                  slide.image && slide.note
                    ? "md:grid-cols-[minmax(0,1fr)_300px]"
                    : ""
                }`}
              >
                {slide.note ? (
                  <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(254,243,199,0.76))] px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-amber-300/20 dark:bg-[linear-gradient(135deg,rgba(251,191,36,0.13),rgba(245,158,11,0.06))]">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase text-amber-700 dark:text-amber-200">
                      <Icon icon="mdi:comment-text-outline" className="h-4 w-4" />
                      Note
                    </div>
                    <p className="whitespace-pre-wrap text-[15px] font-medium leading-7 text-amber-950 dark:text-amber-50">
                      {slide.note}
                    </p>
                  </div>
                ) : null}

                {slide.image ? (
                  <figure className="overflow-hidden rounded-2xl border border-white/80 bg-slate-950/5 p-2 shadow-[0_18px_54px_-36px_rgba(15,23,42,0.82)] ring-1 ring-slate-200/60 dark:border-white/10 dark:bg-white/[0.045] dark:ring-white/10">
                    <div className="flex max-h-[320px] min-h-[180px] items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-black/24">
                      <Image
                        src={slide.image.url}
                        alt={slide.title}
                        width={slide.image.width ?? 960}
                        height={slide.image.height ?? 540}
                        sizes="(min-width: 768px) 300px, 100vw"
                        unoptimized
                        className="max-h-[320px] w-full object-contain"
                      />
                    </div>
                  </figure>
                ) : null}
              </div>
            ) : null}
          </div>

          {hasChildren ? (
            <div className="brify-slide-children rounded-2xl border border-white/80 bg-white/74 px-5 py-5 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.62)] ring-1 ring-slate-200/65 backdrop-blur-2xl dark:border-white/10 dark:bg-[#101826]/70 dark:ring-white/10 md:px-7 md:py-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xs font-bold uppercase text-slate-500 dark:text-white/55">
                  Direct Children
                </h2>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                  {slide.children.length}
                </span>
              </div>
              <ol className="grid grid-cols-1 gap-3">
                {slide.children.map((child, childIndex) => (
                  <li
                    key={child.id}
                    style={{ animationDelay: `${180 + childIndex * 54}ms` }}
                    className={`group flex min-h-16 items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                      child.highlightVariant
                        ? "border-amber-300/80 bg-amber-50/90 shadow-[0_14px_34px_-30px_rgba(180,83,9,0.72)] hover:border-amber-400 dark:border-amber-200/25 dark:bg-amber-300/10 dark:hover:border-amber-200/40"
                        : "border-slate-200/85 bg-slate-50/78 hover:border-teal-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-cyan-300/25 dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold shadow-sm transition-colors ${
                        child.highlightVariant
                          ? "bg-amber-400 text-amber-950 group-hover:bg-amber-300 dark:bg-amber-300"
                          : "bg-slate-900 text-white group-hover:bg-teal-700 dark:bg-cyan-300 dark:text-slate-950 dark:group-hover:bg-cyan-200"
                      }`}
                    >
                      {child.highlightVariant ? (
                        <Icon icon="mdi:marker" className="h-4 w-4" />
                      ) : (
                        childIndex + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      {child.titleHtml ? (
                        <span
                          className="block text-[17px] font-semibold leading-7 text-slate-900 dark:text-white md:text-[18px]"
                          dangerouslySetInnerHTML={{ __html: child.titleHtml }}
                        />
                      ) : (
                        <span className="block text-[17px] font-semibold leading-7 text-slate-900 dark:text-white md:text-[18px]">
                          {child.title}
                        </span>
                      )}
                      {child.hasChildren ? (
                        <span className="mt-1 inline-flex text-[12px] font-medium text-slate-500 dark:text-white/50">
                          {child.childCount} child nodes
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="brify-slide-children inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/58 px-4 py-2.5 text-sm font-semibold text-slate-500 shadow-[0_14px_42px_-34px_rgba(15,23,42,0.68)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:text-white/50">
              <Icon icon="mdi:check-circle-outline" className="h-4 w-4 text-teal-600 dark:text-cyan-300" />
              No child nodes
            </div>
          )}
        </section>
      </main>

      <footer className="relative flex min-h-16 items-center justify-between gap-3 border-t border-white/60 bg-white/62 px-4 shadow-[0_-18px_46px_-38px_rgba(15,23,42,0.72)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220]/68 md:px-6">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
        >
          <Icon icon="mdi:arrow-left" className="h-4 w-4" />
          Prev
        </button>
        <div className="hidden text-xs font-semibold text-slate-500 dark:text-white/45 md:block">
          Arrow keys, Space, Home, End, Esc
        </div>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => setIndex((prev) => Math.min(slides.length - 1, prev + 1))}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
        >
          Next
          <Icon icon="mdi:arrow-right" className="h-4 w-4" />
        </button>
      </footer>

      <style jsx global>{`
        @keyframes brify-slide-stage-in {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.992);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes brify-slide-item-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes brify-highlight-breathe {
          0%,
          100% {
            box-shadow: 0 24px 80px -46px rgba(15, 23, 42, 0.68);
          }
          50% {
            box-shadow:
              0 24px 80px -46px rgba(15, 23, 42, 0.68),
              0 0 0 6px rgba(251, 191, 36, 0.12);
          }
        }

        .brify-slide-stage {
          animation: brify-slide-stage-in 340ms cubic-bezier(0.2, 0.8, 0.2, 1)
            both;
        }

        .brify-slide-kicker,
        .brify-slide-title,
        .brify-slide-detail,
        .brify-slide-children {
          opacity: 0;
          animation: brify-slide-item-in 420ms cubic-bezier(0.2, 0.8, 0.2, 1)
            both;
        }

        .brify-slide-kicker {
          animation-delay: 50ms;
        }

        .brify-slide-title {
          animation-delay: 100ms;
        }

        .brify-slide-detail {
          animation-delay: 150ms;
        }

        .brify-slide-children {
          animation-delay: 175ms;
        }

        .brify-slide-children li {
          opacity: 0;
          animation: brify-slide-item-in 360ms cubic-bezier(0.2, 0.8, 0.2, 1)
            both;
        }

        .brify-slide-highlight-card {
          animation-name: brify-highlight-breathe;
          animation-duration: 1800ms;
          animation-timing-function: ease-in-out;
          animation-delay: 420ms;
          animation-iteration-count: 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .brify-slide-stage,
          .brify-slide-kicker,
          .brify-slide-title,
          .brify-slide-detail,
          .brify-slide-children,
          .brify-slide-children li,
          .brify-slide-highlight-card {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
