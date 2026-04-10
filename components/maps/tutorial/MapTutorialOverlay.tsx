"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { getShortcutCopy } from "@/components/maps/shortcutCopy";

export type MapTutorialLanguage = "ko" | "en";

export type MapTutorialIllustration =
  | "mode"
  | "mouse"
  | "trackpad"
  | "context"
  | "highlight"
  | "expand";

export type MapTutorialStep = {
  title: string;
  description: string;
  targetId?: string;
  targetSelector?: string;
  targetClassName: string;
  hideTargetRing?: boolean;
  highlightCalloutRing?: boolean;
  hideCalloutOnMobile?: boolean;
  hideCallout?: boolean;
  calloutClassName: string;
  calloutTitle: string;
  calloutDescription?: string;
  illustration?: MapTutorialIllustration;
  content?: "shortcuts";
};

function TutorialIllustration({
  type,
}: {
  type: MapTutorialIllustration;
}) {
  const t = useTranslations("MapTutorial");

  if (type === "mode") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
        <span className="rounded-lg bg-white px-2 py-1 shadow-sm">{t("illustrations.mode.view")}</span>
        <Icon icon="mdi:swap-horizontal" className="h-5 w-5" />
        <span className="rounded-lg bg-red-600 px-2 py-1 text-white shadow-sm">{t("illustrations.mode.edit")}</span>
      </div>
    );
  }

  if (type === "mouse") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
        <Image
          src="/images/mouserightclick.png"
          alt={t("illustrations.mouse.alt")}
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
        />
        <div className="text-sm font-bold">{t("illustrations.mouse.label")}</div>
      </div>
    );
  }

  if (type === "trackpad") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
        <Image
          src="/images/twofingers.png"
          alt={t("illustrations.trackpad.alt")}
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
        />
        <div className="text-sm font-bold">{t("illustrations.trackpad.label")}</div>
      </div>
    );
  }

  if (type === "context") {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-2 shadow-sm">
        <Image
          src="/images/contextmenu.png"
          alt={t("illustrations.context.alt")}
          width={180}
          height={180}
          className="h-auto w-full max-w-[180px] object-contain"
        />
      </div>
    );
  }

  if (type === "expand") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-red-700">
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-red-200">
          <span className="absolute inset-0 rounded-full border-2 border-red-300/80" />
          <Icon icon="mdi:plus" className="relative z-[1] h-6 w-6" />
        </span>
        <div className="text-left">
          <div className="text-sm font-extrabold">{t("illustrations.expand.label")}</div>
          <div className="mt-1 text-[12px] font-semibold text-red-600/80">
            {t("illustrations.expand.description")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-1.5 py-1 shadow-sm ring-1 ring-black/5">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white shadow-sm ring-1 ring-red-600/50 opacity-75">
        <Icon icon="mdi:note-text-outline" className="h-4 w-4" />
      </span>
      <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-yellow-400 text-black shadow-[0_10px_28px_-10px_rgba(234,179,8,0.72)] ring-2 ring-yellow-500/80">
        <span className="absolute inset-[-7px] animate-pulse rounded-full border-4 border-yellow-300/85" />
        <span className="absolute inset-[-13px] rounded-full border-2 border-amber-400/45" />
        <Icon icon="mdi:marker" className="relative z-[1] h-6 w-6" />
      </span>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-500/90 text-white shadow-sm ring-1 ring-green-600/50 opacity-75">
        <Icon icon="mdi:target" className="h-4 w-4" />
      </span>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/95 text-white shadow-sm ring-1 ring-slate-900/60 opacity-80">
        <Icon icon="mdi:dots-horizontal" className="h-4 w-4" />
      </span>
    </div>
  );
}

export default function MapTutorialOverlay({
  stepIndex,
  steps,
  onNext,
  onSkip,
}: {
  stepIndex: number;
  steps: MapTutorialStep[];
  onNext: () => void;
  onSkip: () => void;
}) {
  const t = useTranslations("MapTutorial");
  const locale = useLocale();
  const messages = useMessages() as {
    ShortcutsDialog?: import("@/components/maps/shortcutCopy").ShortcutMessages;
  };
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const shortcutCopy =
    step.content === "shortcuts" ? getShortcutCopy(locale, messages) : null;
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [measuredTargetStyle, setMeasuredTargetStyle] = useState<React.CSSProperties | null>(
    null
  );
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobileViewport(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!step.targetSelector && !step.targetId) {
      setMeasuredTargetStyle(null);
      return;
    }

    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const updatePosition = () => {
      const target = step.targetId
        ? document.getElementById(step.targetId)
        : step.targetSelector
          ? document.querySelector(step.targetSelector)
          : null;
      if (!(target instanceof HTMLElement)) {
        setMeasuredTargetStyle(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      const padding = stepIndex === 0 ? 8 : 12;
      setMeasuredTargetStyle({
        left: rect.left - padding,
        top: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updatePosition);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    const target = step.targetId
      ? document.getElementById(step.targetId)
      : step.targetSelector
        ? document.querySelector(step.targetSelector)
        : null;

    if (target instanceof HTMLElement && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        scheduleUpdate();
      });
      resizeObserver.observe(target);
    }

    const settleTimers = [
      window.setTimeout(scheduleUpdate, 60),
      window.setTimeout(scheduleUpdate, 180),
      window.setTimeout(scheduleUpdate, 360),
    ];

    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
      window.cancelAnimationFrame(frameId);
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      resizeObserver?.disconnect();
    };
  }, [step.targetId, step.targetSelector, stepIndex]);

  const shouldRenderMeasuredTarget = Boolean(measuredTargetStyle);
  const shouldRenderFallbackTarget = !step.targetId && !step.targetSelector;

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport) return;
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 56) return;
    if (Math.abs(deltaY) > 42) return;
    if (deltaX < 0) {
      onNext();
    }
  };

  return (
    <div className="fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-slate-950/38" />

      {(shouldRenderMeasuredTarget || shouldRenderFallbackTarget) && !step.hideTargetRing ? (
        <div
          className={`pointer-events-none absolute ${shouldRenderMeasuredTarget ? "" : step.targetClassName}`}
          style={shouldRenderMeasuredTarget ? measuredTargetStyle ?? undefined : undefined}
        >
          <div className="absolute inset-0 rounded-full border-4 border-red-500/95 shadow-[0_0_0_8px_rgba(239,68,68,0.18)]" />
          <div className="absolute inset-0 animate-ping rounded-full border-4 border-red-400/80" />
          <div className="absolute inset-2 rounded-full border border-white/80" />
        </div>
      ) : null}

      {(!isMobileViewport || !step.hideCalloutOnMobile) && !step.hideCallout ? (
        <div className={`pointer-events-none absolute ${step.calloutClassName}`}>
          {step.highlightCalloutRing ? (
            <>
              <div className="absolute -inset-3 rounded-[30px] border-4 border-red-500/95 shadow-[0_0_0_8px_rgba(239,68,68,0.18)]" />
              <div className="absolute -inset-3 animate-ping rounded-[30px] border-4 border-red-400/80" />
              <div className="absolute -inset-1 rounded-[26px] border border-white/80" />
            </>
          ) : null}
          <div className="relative rounded-[24px] border border-red-200 bg-white/96 p-4 text-slate-800 shadow-[0_32px_80px_-36px_rgba(15,23,42,0.55)]">
            <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-red-600">
              {step.calloutTitle}
            </div>
            {step.calloutDescription ? (
              <div className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {step.calloutDescription}
              </div>
            ) : null}
            {step.illustration ? (
              <div className="mt-3">
                <TutorialIllustration type={step.illustration} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={`absolute inset-0 flex p-4 sm:p-6 ${isMobileViewport ? "items-end justify-center" : "items-center justify-center"}`}>
        <div
          className={`pointer-events-auto w-full border border-white/20 bg-[#0f172a]/96 text-white shadow-[0_36px_100px_-42px_rgba(0,0,0,0.75)] ${isMobileViewport ? "max-w-[24rem] rounded-[26px] px-4 py-4" : "max-w-md rounded-[30px] p-6"}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="mt-0 flex items-center gap-2">
              <div className="rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs font-black tracking-[0.16em] text-white/78">
                {t("overlay.label")}
              </div>
              <div className="rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs font-bold tracking-[0.16em] text-white/75">
                {stepIndex + 1}/{steps.length}
              </div>
            </div>
            <button
              type="button"
              onClick={onSkip}
              className="mt-0 text-sm font-semibold text-white/65 transition-colors hover:text-white"
            >
              {t("overlay.skip")}
            </button>
          </div>

          <h3 className={`mt-4 font-black tracking-tight text-white ${isMobileViewport ? "text-[19px]" : "text-[22px]"}`}>
            {step.title}
          </h3>
          <p className={`mt-3 font-medium text-white/78 ${isMobileViewport ? "text-[13px] leading-6" : "text-[14px] leading-6"}`}>
            {step.description}
          </p>
          {isMobileViewport && step.illustration ? (
            <div className="mt-4 flex justify-center">
              <TutorialIllustration type={step.illustration} />
            </div>
          ) : null}
          {step.content === "shortcuts" && shortcutCopy ? (
            <div className="mt-4 rounded-[22px] border border-white/12 bg-white/6 p-3">
              <div className="mb-2 text-[12px] font-bold tracking-[0.08em] text-white/60">
                {shortcutCopy.title}
              </div>
              <div className="grid max-h-56 gap-2 overflow-y-auto pr-1 text-[12px]">
                <div className="grid grid-cols-[1fr_1.4fr] gap-2 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-white/65">
                  <span>{shortcutCopy.columns.shortcut}</span>
                  <span>{shortcutCopy.columns.action}</span>
                </div>
                {shortcutCopy.items.map(({ key, description }) => (
                  <div
                    key={key}
                    className="grid grid-cols-[1fr_1.4fr] gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/80"
                  >
                    <span className="font-semibold text-white/92">{key}</span>
                    <span>{description}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onNext}
            className={`mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-red-500 px-4 font-bold text-white shadow-[0_18px_40px_-18px_rgba(239,68,68,0.58)] transition-transform hover:scale-[1.01] hover:bg-red-400 ${isMobileViewport ? "py-3 text-[14px]" : "py-3 text-[15px]"}`}
          >
            {isLast ? t("overlay.start") : t("overlay.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
