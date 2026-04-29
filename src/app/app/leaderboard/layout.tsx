import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Compete with fellow learners on the weekly leaderboard. Earn XP by completing lessons, quizzes, and daily challenges to climb the ranks.",
  openGraph: {
    title: "Leaderboard | Guru Sishya",
    description:
      "Compete with fellow learners on the weekly leaderboard. Earn XP by completing lessons, quizzes, and daily challenges.",
    url: "https://www.guru-sishya.in/app/leaderboard",
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
