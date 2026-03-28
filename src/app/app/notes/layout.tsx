import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Notes | Guru Sishya",
  description: "View and manage study notes across all interview preparation topics. Search, filter, and revisit key concepts.",
};

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
