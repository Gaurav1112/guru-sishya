import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/learn",
          "/learn/",
          "/app/pricing",
          "/app/roadmap",
          "/login",
          "/privacy",
          "/terms",
          "/contact",
          "/dsa-interview-questions",
          "/system-design-interview",
          "/behavioral-interview",
          "/top-coding-questions",
          "/leetcode-alternative",
          "/cloud-devops-interview",
          "/database-interview",
          "/backend-interview",
          "/questions-bank",
          "/questions-bank/",
          "/ref/",
        ],
        disallow: ["/app/admin", "/app/", "/api/"],
      },
    ],
    sitemap: "https://www.guru-sishya.in/sitemap.xml",
  };
}
