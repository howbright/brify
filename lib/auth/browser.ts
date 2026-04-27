export function getInAppBrowserName(userAgent: string): string | null {
  const ua = userAgent.toLowerCase();

  if (ua.includes("kakaotalk")) return "KakaoTalk";
  if (ua.includes("instagram")) return "Instagram";
  if (ua.includes("threads")) return "Threads";
  if (ua.includes("fban") || ua.includes("fbav") || ua.includes("fb_iab")) return "Facebook";
  if (ua.includes("line/")) return "LINE";
  if (ua.includes("; wv")) return "in-app browser";

  return null;
}

export function isInAppBrowser(userAgent: string): boolean {
  return getInAppBrowserName(userAgent) !== null;
}

export function isUnsupportedGoogleOauthBrowser(userAgent: string): boolean {
  return isInAppBrowser(userAgent);
}
