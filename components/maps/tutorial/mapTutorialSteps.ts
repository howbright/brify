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
    ];
  }

  return [
    {
      title: t("steps.mouse.title"),
      description: t("steps.mouse.description"),
      targetClassName: "left-[21%] top-[42%] h-24 w-24",
      hideTargetRing: true,
      highlightCalloutRing: true,
      calloutClassName: "left-1/2 top-[7%] w-64 -translate-x-1/2",
      calloutTitle: t("steps.mouse.calloutTitle"),
      calloutDescription: t("steps.mouse.calloutDescription"),
      illustration: "mouse",
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
  ];
}
