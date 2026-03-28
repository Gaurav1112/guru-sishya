import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/learn", "/app/pricing", "/login", "/privacy", "/terms", "/contact"],
        disallow: ["/app/admin", "/app/", "/api/"],
      },
    ],
    sitemap: "https://www.guru-sishya.in/sitemap.xml",
  };
}
