import type { APIRoute } from "astro";
import { ImageResponse } from "@vercel/og";
import { createElement as h } from "react";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? "GURU SISHYA";
  const subtitle = url.searchParams.get("subtitle") ?? "Crack Your Software Engineering Interview";

  const stats = [
    { num: "65", label: "Topics" },
    { num: "828", label: "Questions" },
    { num: "670+", label: "Lessons" },
    { num: "58", label: "STAR Answers" },
  ];

  const companies = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix"];

  return new ImageResponse(
    h("div", {
      style: {
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        fontFamily: "system-ui, sans-serif",
      },
    },
      h("div", { style: { fontSize: 64, fontWeight: 900, color: "#E07B39", letterSpacing: "0.1em", marginBottom: 16 } }, title),
      h("div", { style: { fontSize: 28, color: "#ffffff", fontWeight: 600, marginBottom: 32 } }, subtitle),
      h("div", { style: { display: "flex", gap: 48, marginBottom: 32 } },
        ...stats.map((stat) =>
          h("div", { key: stat.label, style: { display: "flex", flexDirection: "column", alignItems: "center" } },
            h("div", { style: { fontSize: 36, fontWeight: 800, color: "#E07B39" } }, stat.num),
            h("div", { style: { fontSize: 16, color: "#94a3b8" } }, stat.label),
          )
        )
      ),
      h("div", { style: { display: "flex", gap: 24, fontSize: 18, color: "#64748b" } },
        ...companies.map((c) => h("span", { key: c }, c))
      ),
      h("div", { style: { position: "absolute", bottom: 32, fontSize: 16, color: "#475569" } },
        "100% Free · Works Offline · www.guru-sishya.in"
      ),
    ),
    { width: 1200, height: 630 }
  );
};
