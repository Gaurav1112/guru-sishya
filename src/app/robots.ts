import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/learn",
          "/app/pricing",
          "/app/roadmap",
          "/login",
          "/privacy",
          "/terms",
          "/contact",
          "/dsa-interview-questions",
          "/questions-bank",
          "/system-design-interview",
        ],
        disallow: ["/app/admin", "/app/", "/api/"],
      },
    ],
    sitemap: "https://www.guru-sishya.in/sitemap.xml",
  };
}
