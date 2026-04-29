import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "1,730+ Software Engineering Interview Questions with Answers | Guru Sishya",
  description:
    "Browse 1,730+ curated software engineering interview questions with detailed answers. Covers DSA, system design, Java, Python, React, and behavioral questions. Filter by difficulty and topic.",
  openGraph: {
    title: "1,730+ Software Engineering Interview Questions with Answers | Guru Sishya",
    description:
      "Browse 1,730+ curated interview questions with detailed answers. DSA, system design, Java, Python, React, and behavioral questions.",
    url: "https://www.guru-sishya.in/app/questions",
  },
};

export default function QuestionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
