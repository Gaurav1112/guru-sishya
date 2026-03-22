import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          borderRadius: 34,
          background: "#E85D26",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#121218",
          fontFamily: "sans-serif",
          fontWeight: 900,
          fontSize: 68,
          letterSpacing: "-2px",
        }}
      >
        GS
      </div>
    ),
    { width: 192, height: 192 }
  );
}
