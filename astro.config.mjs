// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import mcp from "astro-mcp";
import clerk from "@clerk/astro";

export default defineConfig({
  site: "https://www.guru-sishya.in",
  output: "server",
  adapter: vercel(),
  integrations: [
    clerk(),
    react(),
    sitemap(),
    mcp(),
  ],
  vite: {
    resolve: {
      alias: {
        "@": "/src",
        // Next.js compatibility shims — map next/* to local shims
        "next/link": "/src/lib/link.tsx",
        "next/image": "/src/components/ui/image.tsx",
        "next/navigation": "/src/lib/navigation.ts",
        "next/dynamic": "/src/lib/dynamic.ts",
      },
    },
    build: {
      rollupOptions: {
        // @clerk/astro bundles a Cloudflare Workers import path that doesn't
        // exist on Vercel. Externalizing it prevents Rollup from failing;
        // the code path is never executed outside Cloudflare deployments.
        external: ["cloudflare:workers"],
      },
    },
  },
});
