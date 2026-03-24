import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "710+ Software Engineering Interview Questions with Answers | Guru Sishya",
  description:
    "Browse 710+ curated software engineering interview questions with detailed answers. Covers DSA, system design, Java, Python, React, and behavioral questions. Filter by difficulty and topic.",
  openGraph: {
    title: "710+ Software Engineering Interview Questions with Answers | Guru Sishya",
    description:
      "Browse 710+ curated interview questions with detailed answers. DSA, system design, Java, Python, React, and behavioral questions.",
    url: "https://www.guru-sishya.in/app/questions",
  },
};

export default function QuestionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
