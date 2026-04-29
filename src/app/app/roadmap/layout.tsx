import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Roadmap",
  description:
    "Follow a structured learning roadmap for software engineering interviews. Covers system design, data structures, algorithms, and core CS in the optimal order.",
  openGraph: {
    title: "Learning Roadmap | Guru Sishya",
    description:
      "Follow a structured learning roadmap for software engineering interviews. System design, DSA, and core CS in the optimal order.",
    url: "https://www.guru-sishya.in/app/roadmap",
  },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
