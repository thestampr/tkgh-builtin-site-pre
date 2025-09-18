import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const locales = (process.env.NEXT_PUBLIC_SUPPORTED_LOCALES || "en,th").split(",");

  const basePaths = ["", "/categories", "/built-in", "/estimate", "/contact"];
  const urls: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const p of basePaths) {
      urls.push({
        url: `${base}/${locale}${p || "/"}`,
        lastModified: new Date()
      });
    }
  }

  // Note: For dynamic slugs, fetch from CMS and add here.

  return urls;
}