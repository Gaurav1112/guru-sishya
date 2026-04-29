import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview Revision",
  description: "Review mock interview questions you scored below 7/10. Master weak areas with targeted practice.",
};

export default function RevisionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
