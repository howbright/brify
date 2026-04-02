import type {
  MapTutorialStep,
} from "@/components/maps/tutorial/MapTutorialOverlay";
import type { useTranslations } from "next-intl";

export function getMapTutorialSteps(
  t: ReturnType<typeof useTranslations>,
  options?: {
    platform?: "desktop" | "mobile";
    termsTabId?: string;
    leftPanelButtonId?: string;
  }
): MapTutorialStep[] {
  const platform = options?.platform ?? "desktop";
  const termsTabId = options?.termsTabId ?? "map-tutorial-terms-tab";
  const leftPanelButtonId =
    options?.leftPanelButtonId ?? "map-tutorial-left-panel-button";

  if (platform === "mobile") {
    return [
      {
        title: t("mobile.highlight.title"),
        description: t("mobile.highlight.description"),
        targetClassName: "left-1/2 bottom-[18%] h-24 w-24 -translate-x-1/2",
        hideTargetRing: true,
        highlightCalloutRing: true,
        hideCalloutOnMobile: true,
        calloutClassName: "left-1/2 bottom-[28%] w-[min(18.5rem,calc(100vw-1.5rem))] -translate-x-1/2",
        calloutTitle: t("mobile.highlight.calloutTitle"),
        calloutDescription: t("mobile.highlight.calloutDescription"),
        illustration: "highlight",
      },
      {
        title: t("mobile.expand.title"),
        description: t("mobile.expand.description"),
        targetClassName: "left-1/2 bottom-[18%] h-24 w-24 -translate-x-1/2",
        hideTargetRing: true,
        highlightCalloutRing: true,
        hideCalloutOnMobile: true,
        calloutClassName: "left-1/2 bottom-[28%] w-[min(18.5rem,calc(100vw-1.5rem))] -translate-x-1/2",
        calloutTitle: t("mobile.expand.calloutTitle"),
        calloutDescription: t("mobile.expand.calloutDescription"),
        illustration: "expand",
      },
      {
        title: t("mobile.panel.title"),
        description: t("mobile.panel.description"),
        targetId: leftPanelButtonId,
        targetClassName: "left-4 top-3 h-10 w-10",
        hideCalloutOnMobile: true,
        calloutClassName: "left-4 top-16 w-[min(18.5rem,calc(100vw-1.5rem))]",
        calloutTitle: t("mobile.panel.calloutTitle"),
        calloutDescription: t("mobile.panel.calloutDescription"),
      },
      {
        title: t("mobile.terms.title"),
        description: t("mobile.terms.description"),
        targetId: termsTabId,
        targetClassName: "left-6 top-20 h-14 w-24",
        hideCalloutOnMobile: true,
        calloutClassName: "left-1/2 top-[7.5rem] w-[min(18.5rem,calc(100vw-1.5rem))] -translate-x-1/2",
        calloutTitle: t("mobile.terms.calloutTitle"),
        calloutDescription: t("mobile.terms.calloutDescription"),
      },
    ];
  }

  return [
    {
      title: t("steps.mouse.title"),
      description: t("steps.mouse.description"),
      targetClassName: "left-[21%] top-[42%] h-24 w-24",
      hideTargetRing: true,
      highlightCalloutRing: true,
      calloutClassName: "left-1/2 top-[14%] w-64 -translate-x-1/2",
      calloutTitle: t("steps.mouse.calloutTitle"),
      calloutDescription: t("steps.mouse.calloutDescription"),
      illustration: "mouse",
    },
    {
      title: t("steps.highlight.title"),
      description: t("steps.highlight.description"),
      targetClassName: "right-[18%] bottom-[16%] h-24 w-24",
      hideTargetRing: true,
      highlightCalloutRing: true,
      calloutClassName: "right-[10%] bottom-[31%] w-72",
      calloutTitle: t("steps.highlight.calloutTitle"),
      calloutDescription: t("steps.highlight.calloutDescription"),
      illustration: "highlight",
    },
    {
      title: t("steps.expand.title"),
      description: t("steps.expand.description"),
      targetClassName: "right-[18%] bottom-[16%] h-24 w-24",
      hideTargetRing: true,
      highlightCalloutRing: true,
      calloutClassName: "right-[10%] bottom-[31%] w-72",
      calloutTitle: t("steps.expand.calloutTitle"),
      calloutDescription: t("steps.expand.calloutDescription"),
      illustration: "expand",
    },
    {
      title: t("steps.terms.title"),
      description: t("steps.terms.description"),
      targetId: termsTabId,
      targetClassName: "left-8 top-8 h-16 w-24",
      calloutClassName: "left-[19rem] top-[7.5rem] w-80",
      calloutTitle: t("steps.terms.calloutTitle"),
      calloutDescription: t("steps.terms.calloutDescription"),
    },
    {
      title: t("steps.shortcuts.title"),
      description: t("steps.shortcuts.description"),
      targetClassName: "left-0 top-0 h-0 w-0",
      hideTargetRing: true,
      hideCallout: true,
      calloutClassName: "",
      calloutTitle: "",
      content: "shortcuts",
    },
  ];
}
