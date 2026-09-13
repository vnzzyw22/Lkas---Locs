import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

// Só as rotas públicas — /admin é área restrita, não deve ser indexada nem
// listada aqui (ver robots.ts, que já bloqueia o crawl dela).
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/agendar`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
