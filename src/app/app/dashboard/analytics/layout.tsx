import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Progress Analytics | Guru Sishya",
  description:
    "Track your interview preparation progress with accuracy trends, topic strength radar, weak areas analysis, and quiz performance breakdowns.",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
