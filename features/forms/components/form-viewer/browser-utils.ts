"use client";

export function isLikelyInAppBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase();

  return (
    ua.includes("instagram") ||
    ua.includes("fban") ||
    ua.includes("fbav") ||
    ua.includes("fb_iab") ||
    ua.includes("fbios")
  );
}
