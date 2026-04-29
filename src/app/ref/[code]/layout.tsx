import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You've Been Invited",
  description:
    "Join Guru Sishya — a free interview preparation platform with 81 topics, 1730 questions, system design, and behavioral prep. No signup required to start.",
  robots: { index: false, follow: true },
  openGraph: {
    title: "You've Been Invited to Guru Sishya",
    description:
      "Free interview prep: 81 topics, 1730 questions, system design, behavioral STAR prep, and a code playground. Start for free.",
    url: "https://www.guru-sishya.in",
    type: "website",
    siteName: "Guru Sishya",
    images: [{ url: "https://www.guru-sishya.in/api/og", width: 1200, height: 630 }],
  },
};

export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return children;
}
