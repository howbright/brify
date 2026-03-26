export type MapTutorialPlatform = "desktop" | "mobile";

const MAP_TUTORIAL_STORAGE_KEYS: Record<MapTutorialPlatform, string> = {
  desktop: "brify:map-tutorial-completed:desktop:v2",
  mobile: "brify:map-tutorial-completed:mobile:v2",
};

function getMapTutorialStorageKey(platform: MapTutorialPlatform): string {
  return MAP_TUTORIAL_STORAGE_KEYS[platform];
}

export function getMapTutorialCompleted(
  platform: MapTutorialPlatform = "desktop"
): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(getMapTutorialStorageKey(platform)) === "true"
    );
  } catch {
    return false;
  }
}

export function setMapTutorialCompleted(
  completed: boolean,
  platform: MapTutorialPlatform = "desktop"
): void {
  if (typeof window === "undefined") return;
  try {
    const key = getMapTutorialStorageKey(platform);
    if (completed) {
      window.localStorage.setItem(key, "true");
      return;
    }
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures so the tutorial still works in restricted environments.
  }
}
