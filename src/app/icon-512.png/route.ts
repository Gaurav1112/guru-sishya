import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 90,
          background: "#E85D26",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#121218",
          fontFamily: "sans-serif",
          fontWeight: 900,
          fontSize: 182,
          letterSpacing: "-6px",
        }}
      >
        GS
      </div>
    ),
    { width: 512, height: 512 }
  );
}
