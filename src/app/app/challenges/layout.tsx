import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Challenges - Compete with Friends",
  description: "Create and manage quiz challenges with friends. Track scores and compete across topics.",
};

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
