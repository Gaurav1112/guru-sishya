import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Mock Interview",
  description:
    "Practice software engineering interviews with AI-powered mock interview sessions. Get real-time feedback on system design, DSA, and behavioral questions.",
  openGraph: {
    title: "AI Mock Interview | Guru Sishya",
    description:
      "Practice software engineering interviews with AI-powered mock sessions. Real-time feedback on system design, DSA, and behavioral questions.",
    url: "https://www.guru-sishya.in/app/interview",
  },
};

export default function InterviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
