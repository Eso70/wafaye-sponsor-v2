import { MetadataRoute } from "next";
import { db } from "@/database/db";
import { getAppUrl } from "@/lib/app-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  try {
    const res = await db.query(
      `SELECT slug, updated_at FROM linktree_pages WHERE is_official = false AND expires_at >= CURRENT_DATE`
    );
    for (const row of res.rows) {
      entries.push({
        url: `${baseUrl}/p/${row.slug}`,
        lastModified: new Date(row.updated_at),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // If DB fails, return homepage only
  }

  return entries;
}
