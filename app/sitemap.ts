import type { MetadataRoute } from "next";
import { getAbsoluteUrl } from "@/lib/seo/site-url";

const MARKETING_ROUTES = ["/", "/it", "/es"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return MARKETING_ROUTES.map((path) => ({
    url: getAbsoluteUrl(path),
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/it" ? 1 : 0.9,
  }));
}
