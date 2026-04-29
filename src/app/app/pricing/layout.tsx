import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Free & Pro Plans",
  description:
    "Start free with 81 topics, 1730 questions, and full lessons. Upgrade to Pro for AI-powered Teach Mode, custom topics, and certificates. Plans from Rs 149/month.",
  alternates: { canonical: "https://www.guru-sishya.in/app/pricing" },
  openGraph: {
    title: "Pricing — Free & Pro Plans | Guru Sishya",
    description:
      "Start free with 81 topics, 1730 questions, and full lessons. Upgrade to Pro for AI-powered features and certificates from Rs 149/month.",
    url: "https://www.guru-sishya.in/app/pricing",
    type: "website",
    siteName: "Guru Sishya",
    images: [{ url: "https://www.guru-sishya.in/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Free & Pro Plans | Guru Sishya",
    description:
      "81 topics and 1730 questions free forever. Pro from Rs 149/month for AI features.",
    images: ["https://www.guru-sishya.in/api/og"],
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
