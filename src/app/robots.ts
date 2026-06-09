import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login", "/billing", "/api"],
    },
    sitemap: "https://replo.kr/sitemap.xml",
  };
}
