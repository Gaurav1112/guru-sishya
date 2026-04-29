import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Questions | Guru Sishya",
  description: "Your bookmarked and review-needed interview questions in one place. Track mastery of 1,730+ software engineering questions.",
};

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
