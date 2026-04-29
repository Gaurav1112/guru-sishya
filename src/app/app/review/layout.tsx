import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flashcard Review - Spaced Repetition",
  description:
    "Review interview concepts with SM-2 spaced repetition flashcards. Retain knowledge longer with scientifically-proven review intervals across all 81 topics.",
  openGraph: {
    title: "Flashcard Review - Spaced Repetition | Guru Sishya",
    description:
      "Review interview concepts with SM-2 spaced repetition flashcards. Retain knowledge longer with scientifically-proven review intervals.",
    url: "https://www.guru-sishya.in/app/review",
  },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
