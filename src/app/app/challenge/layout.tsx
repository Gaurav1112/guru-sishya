import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Challenge | Guru Sishya",
  description: "Accept a quiz challenge from a friend. Answer the same questions and compare scores.",
};

export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
