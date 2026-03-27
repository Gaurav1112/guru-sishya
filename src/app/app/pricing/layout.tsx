import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Free & Pro Plans | Guru Sishya",
  description:
    "Start free with 56 topics, 710+ questions, and full lessons. Upgrade to Pro for AI-powered Feynman Technique, custom topics, and certificates. Plans from Rs 129/month.",
  openGraph: {
    title: "Pricing - Free & Pro Plans | Guru Sishya",
    description:
      "Start free with 56 topics, 710+ questions, and full lessons. Upgrade to Pro for AI-powered features and certificates from Rs 129/month.",
    url: "https://www.guru-sishya.in/app/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
