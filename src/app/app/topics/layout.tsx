import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Topics | Guru Sishya",
  description: "Explore 53 software engineering interview topics — from Data Structures and System Design to Behavioral interviews. Track your progress and master each topic.",
};

export default function TopicsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
