import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);

    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1);
    }

    if (u.hostname.includes('youtube.com')) {
      const videoId = u.searchParams.get('v');
      if (videoId) return videoId;

      if (u.pathname.startsWith('/embed/')) {
        return u.pathname.split('/')[2];
      }

      if (u.pathname.startsWith('/v/')) {
        return u.pathname.split('/')[2];
      }

      if (u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/')[2];
      }
    }
  } catch {
    return null;
  }
  return null;
}
