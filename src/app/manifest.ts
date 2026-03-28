import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guru Sishya — Interview Prep",
    short_name: "Guru Sishya",
    description:
      "Master software engineering interviews with 138 topics, 1933 questions, and 671 sessions. Works offline.",
    start_url: "/app/dashboard",
    display: "standalone",
    background_color: "#0C0A15",
    theme_color: "#E85D26",
    id: "/",
    scope: "/",
    orientation: "portrait",
    categories: ["education"],
    lang: "en-IN",
    dir: "ltr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
