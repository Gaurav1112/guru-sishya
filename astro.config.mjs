// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import mcp from "astro-mcp";

export default defineConfig({
  site: "https://www.guru-sishya.in",
  output: "server",
  adapter: vercel(),
  integrations: [
    react(),
    sitemap(),
    mcp(),
  ],
  vite: {
    resolve: {
      alias: { "@": "/src" },
    },
  },
});
