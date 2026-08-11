export type YoutubeReservationStatus =
  | "requested"
  | "checking"
  | "ready"
  | "needs_credits"
  | "processing"
  | "done"
  | "failed"
  | "cancelled"
  | "unsupported"
  | "retry_requested";

export const YOUTUBE_RESERVATION_STATUSES: YoutubeReservationStatus[] = [
  "requested",
  "checking",
  "ready",
  "needs_credits",
  "processing",
  "done",
  "failed",
  "cancelled",
  "unsupported",
  "retry_requested",
];

export type YoutubeUrlInfo = {
  normalizedUrl: string;
  videoId: string | null;
  isYoutube: boolean;
  isShorts: boolean;
};

function normalizeUrlInput(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.)?(youtube\.com|youtu\.be)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function parseYoutubeUrl(input: string): YoutubeUrlInfo {
  const normalizedInput = normalizeUrlInput(input);

  try {
    const url = new URL(normalizedInput);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const isYoutube =
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtu.be";

    if (!isYoutube) {
      return {
        normalizedUrl: input.trim(),
        videoId: null,
        isYoutube: false,
        isShorts: false,
      };
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const isShorts = pathParts[0]?.toLowerCase() === "shorts";
    const videoId =
      host === "youtu.be"
        ? pathParts[0] ?? null
        : isShorts
          ? pathParts[1] ?? null
          : url.searchParams.get("v") ?? null;

    return {
      normalizedUrl: url.toString(),
      videoId,
      isYoutube: true,
      isShorts,
    };
  } catch {
    return {
      normalizedUrl: input.trim(),
      videoId: null,
      isYoutube: false,
      isShorts: false,
    };
  }
}

export function isYoutubeUrl(input: string) {
  return parseYoutubeUrl(input).isYoutube;
}
