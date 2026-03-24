import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | Guru Sishya",
  description:
    "View your interview preparation profile. Track total XP, completed topics, quiz accuracy, streak history, and earned badges.",
  openGraph: {
    title: "Profile | Guru Sishya",
    description:
      "View your interview preparation profile. Track total XP, completed topics, quiz accuracy, streak history, and earned badges.",
    url: "https://www.guru-sishya.in/app/profile",
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
