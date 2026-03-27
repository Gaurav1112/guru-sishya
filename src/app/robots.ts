import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/login", "/privacy", "/terms", "/contact"],
        disallow: ["/app/", "/api/"],
      },
    ],
    sitemap: "https://www.guru-sishya.in/sitemap.xml",
  };
}
