import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview Questions | Guru Sishya",
  description: "Browse 1292+ curated software engineering interview questions across all topics. Filter by difficulty, topic, and type.",
};

export default function QuestionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
