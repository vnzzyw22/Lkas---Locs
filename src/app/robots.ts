import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

// /admin é área restrita (login obrigatório) — sem valor pra indexação e
// não deve aparecer em busca. /agendar e a home ficam liberados.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
