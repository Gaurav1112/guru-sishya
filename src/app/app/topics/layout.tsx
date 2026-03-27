import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "65 Interview Preparation Topics - System Design, DSA, Core CS | Guru Sishya",
  description:
    "Explore 65 software engineering interview topics with full lessons, quizzes, and cheat sheets. Covers system design, data structures, algorithms, and core CS for FAANG interviews.",
  openGraph: {
    title: "65 Interview Preparation Topics | Guru Sishya",
    description:
      "Explore 65 topics with full lessons, quizzes, and cheat sheets. System design, DSA, and core CS for FAANG interviews.",
    url: "https://www.guru-sishya.in/app/topics",
  },
};

export default function TopicsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
