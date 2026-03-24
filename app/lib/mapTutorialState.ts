export const MAP_TUTORIAL_STORAGE_KEY = "brify:map-tutorial-completed:v1";

export function getMapTutorialCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MAP_TUTORIAL_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setMapTutorialCompleted(completed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (completed) {
      window.localStorage.setItem(MAP_TUTORIAL_STORAGE_KEY, "true");
      return;
    }
    window.localStorage.removeItem(MAP_TUTORIAL_STORAGE_KEY);
  } catch {
    // Ignore storage failures so the tutorial still works in restricted environments.
  }
}
