import { ImageResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "stats";
  const value = searchParams.get("value") ?? "";
  const name = searchParams.get("name") ?? "";

  // ── Derive card content ───────────────────────────────────────────────────
  type CardConfig = {
    headline: string;
    sub: string;
    accent: string;
    icon: string;
  };

  const cards: Record<string, CardConfig> = {
    streak: {
      headline: `${value}-Day Streak`,
      sub: "Consistent daily practice — the hallmark of a true scholar.",
      accent: "#f97316",
      icon: "fire",
    },
    badge: {
      headline: name || "Badge Unlocked",
      sub: "A new achievement earned through dedicated study.",
      accent: "#fbbf24",
      icon: "badge",
    },
    mastery: {
      headline: name || "Topic Mastered",
      sub: "Deep understanding forged through the Feynman Technique.",
      accent: "#00bf8f",
      icon: "star",
    },
    stats: {
      headline: `${value} Topics Learned`,
      sub: "Building interview-ready mastery, one topic at a time.",
      accent: "#E85D26",
      icon: "chart",
    },
    quiz: {
      headline: `Quiz Score: ${value}/10`,
      sub: name ? `on "${name}"` : "Tested and proven knowledge.",
      accent: "#a855f7",
      icon: "trophy",
    },
  };

  const card = cards[type] ?? cards.stats;

  // ── SVG icons (inline, no external deps) ─────────────────────────────────
  const iconPaths: Record<string, string> = {
    fire: "M12 2C12 2 9 7 9 11a3 3 0 006 0c0-1.5-.8-3-3-4 .5 2-1 3.5-1 3.5S8 8 8 6c-2 3-2 5 0 7.5C9.2 15.2 10.5 16 12 16s2.8-.8 4-2.5C18 11 18 9 16 6c0 2-1.5 3-1.5 3S12 7.5 12 2z",
    badge: "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z",
    chart: "M3 3v18h18M9 17V9m4 8v-5m4 5V5",
    trophy: "M8 21h8m-4-4v4m-6-7H4a2 2 0 01-2-2v-1a2 2 0 012-2h2m12 5h2a2 2 0 002-2v-1a2 2 0 00-2-2h-2m-8-4V3a2 2 0 012-2h2a2 2 0 012 2v6M6 7H4a2 2 0 00-2 2v1a2 2 0 002 2h2m12-5h2a2 2 0 012 2v1a2 2 0 01-2 2h-2",
  };

  const iconPath = iconPaths[card.icon] ?? iconPaths.star;
  const accentRgb = hexToRgbString(card.accent);

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0d0d14 0%, #1a1a2e 60%, #12121e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow blob */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${accentRgb},0.12) 0%, transparent 70%)`,
          }}
        />

        {/* Top-left corner dots grid */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {[0, 1, 2].map((row) => (
            <div key={row} style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2].map((col) => (
                <div
                  key={col}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Bottom-right corner dots grid */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {[0, 1, 2].map((row) => (
            <div key={row} style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2].map((col) => (
                <div
                  key={col}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Brand name */}
        <div
          style={{
            color: "#E85D26",
            fontSize: 18,
            letterSpacing: "0.35em",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          GURU SISHYA
        </div>

        {/* Icon circle */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: `rgba(${accentRgb}, 0.15)`,
            border: `2px solid rgba(${accentRgb}, 0.4)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke={card.accent}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={iconPath} />
          </svg>
        </div>

        {/* Headline */}
        <div
          style={{
            color: "#FAFAF7",
            fontSize: type === "mastery" && name.length > 30 ? 44 : 56,
            fontWeight: 800,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.15,
            marginBottom: 20,
            letterSpacing: "-0.02em",
          }}
        >
          {card.headline}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 60,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)`,
            borderRadius: 2,
            marginBottom: 20,
          }}
        />

        {/* Sub-text */}
        <div
          style={{
            color: "#8888A0",
            fontSize: 22,
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.5,
          }}
        >
          {card.sub}
        </div>

        {/* Bottom tag line */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: "#4a4a6a",
              fontSize: 16,
              letterSpacing: "0.08em",
            }}
          >
            Ace Your Software Engineering Interview
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

// ── Helper ─────────────────────────────────────────────────────────────────

function hexToRgbString(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "232,93,38";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}
