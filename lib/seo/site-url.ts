const DEFAULT_SITE_URL = "https://www.formkiller.cloud";

export function getSiteUrl() {
  const rawSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    DEFAULT_SITE_URL;

  return new URL(rawSiteUrl);
}

export function getAbsoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}
