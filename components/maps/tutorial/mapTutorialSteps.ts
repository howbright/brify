import type {
  MapTutorialStep,
} from "@/components/maps/tutorial/MapTutorialOverlay";
import type { useTranslations } from "next-intl";

export function getMapTutorialSteps(
  t: ReturnType<typeof useTranslations>,
  options?: {
    platform?: "desktop" | "mobile";
    editButtonId?: string;
    termsTabId?: string;
  }
): MapTutorialStep[] {
  const platform = options?.platform ?? "desktop";
  const editButtonId = options?.editButtonId ?? "map-tutorial-edit-button";
  const termsTabId = options?.termsTabId ?? "map-tutorial-terms-tab";

  if (platform === "mobile") {
    return [
      {
        title: t("mobile.move.title"),
        description: t("mobile.move.description"),
        targetClassName: "left-1/2 top-[38%] h-24 w-24 -translate-x-1/2",
        hideTargetRing: true,
        highlightCalloutRing: true,
        hideCalloutOnMobile: true,
        calloutClassName: "left-1/2 top-[17%] w-[min(18rem,calc(100vw-1.5rem))] -translate-x-1/2",
        calloutTitle: t("mobile.move.calloutTitle"),
        calloutDescription: t("mobile.move.calloutDescription"),
      },
      {
        title: t("mobile.select.title"),
        description: t("mobile.select.description"),
        targetClassName: "left-1/2 top-[38%] h-24 w-24 -translate-x-1/2",
        hideTargetRing: true,
        highlightCalloutRing: true,
        hideCalloutOnMobile: true,
        calloutClassName: "left-1/2 top-[21%] w-[min(18.5rem,calc(100vw-1.5rem))] -translate-x-1/2",
        calloutTitle: t("mobile.select.calloutTitle"),
        calloutDescription: t("mobile.select.calloutDescription"),
      },
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
      title: t("steps.edit.title"),
      description: t("steps.edit.description"),
      targetId: editButtonId,
      targetClassName: "top-5 right-[17rem] h-20 w-20 sm:right-[18rem]",
      calloutClassName: "top-24 right-[11.5rem] w-64 sm:right-[13rem]",
      calloutTitle: t("steps.edit.calloutTitle"),
      calloutDescription: t("steps.edit.calloutDescription"),
      illustration: "mode",
    },
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
      title: t("steps.context.title"),
      description: t("steps.context.description"),
      targetClassName: "right-[24%] top-[36%] h-28 w-28",
      hideTargetRing: true,
      highlightCalloutRing: true,
      calloutClassName: "right-[10%] top-[24%] w-72",
      calloutTitle: t("steps.context.calloutTitle"),
      calloutDescription: t("steps.context.calloutDescription"),
      illustration: "context",
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
