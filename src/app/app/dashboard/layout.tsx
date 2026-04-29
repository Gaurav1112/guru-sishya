import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Guru Sishya",
  description:
    "Track your interview preparation progress across 81 topics. View XP, streaks, quiz scores, and learning milestones on your personalized dashboard.",
  openGraph: {
    title: "Dashboard | Guru Sishya",
    description:
      "Track your interview preparation progress across 81 topics. View XP, streaks, quiz scores, and learning milestones.",
    url: "https://www.guru-sishya.in/app/dashboard",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
