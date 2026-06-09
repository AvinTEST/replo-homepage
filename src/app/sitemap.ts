import type { MetadataRoute } from "next";

const baseUrl = "https://replo.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/diagnosis`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
