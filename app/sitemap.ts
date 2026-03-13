import type { MetadataRoute } from "next";
import { getAbsoluteUrl } from "@/lib/seo/site-url";

const MARKETING_ROUTES = [
  "/",
  "/it",
  "/es",
  "/privacy-policy",
  "/cookie-policy",
  "/it/privacy-policy",
  "/it/cookie-policy",
  "/es/privacy-policy",
  "/es/cookie-policy",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return MARKETING_ROUTES.map((path) => ({
    url: getAbsoluteUrl(path),
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/it" ? 1 : path === "/" || path === "/es" ? 0.9 : 0.5,
  }));
}
