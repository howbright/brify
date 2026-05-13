export function dispatchNavigationStart(target: string) {
  if (typeof window === "undefined") return;

  const detail = { target };

  try {
    if (typeof window.CustomEvent === "function") {
      window.dispatchEvent(
        new window.CustomEvent("brify:navigation-start", { detail }),
      );
      return;
    }

    if (typeof document !== "undefined" && typeof document.createEvent === "function") {
      const event = document.createEvent("CustomEvent");
      event.initCustomEvent("brify:navigation-start", false, false, detail);
      window.dispatchEvent(event);
    }
  } catch {
    // Navigation feedback is optional. Never block the actual navigation.
  }
}
