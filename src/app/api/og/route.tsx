import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Brand name */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#E07B39",
            letterSpacing: "0.1em",
            marginBottom: 16,
          }}
        >
          GURU SISHYA
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#ffffff",
            fontWeight: 600,
            marginBottom: 32,
          }}
        >
          Crack Your Software Engineering Interview
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 48,
            marginBottom: 32,
          }}
        >
          {[
            { num: "56", label: "Topics" },
            { num: "710+", label: "Questions" },
            { num: "591", label: "Lessons" },
            { num: "58", label: "STAR Answers" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 800, color: "#E07B39" }}>
                {stat.num}
              </div>
              <div style={{ fontSize: 16, color: "#94a3b8" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Company strip */}
        <div
          style={{
            display: "flex",
            gap: 24,
            fontSize: 18,
            color: "#64748b",
          }}
        >
          {["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix"].map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 16,
            color: "#475569",
          }}
        >
          100% Free · Works Offline · www.guru-sishya.in
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
