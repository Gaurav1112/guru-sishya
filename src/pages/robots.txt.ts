import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const content = [
    "User-agent: *",
    "Allow: /",
    "",
    "# Block app shell routes — no SEO value, require auth",
    "Disallow: /app/",
    "Disallow: /api/",
    "",
    "# Sitemap",
    "Sitemap: https://www.guru-sishya.in/sitemap-index.xml",
    "",
  ].join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
