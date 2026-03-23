import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guru Sishya — Interview Prep",
    short_name: "Guru Sishya",
    description: "Master software engineering interviews",
    start_url: "/app/dashboard",
    display: "standalone",
    background_color: "#121218",
    theme_color: "#E85D26",
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  };
}
