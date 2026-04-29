import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Interview Path",
  description:
    "Follow a structured, company-specific interview preparation path. Curated topic sequences for Google, Amazon, Microsoft, Meta, Apple, and Flipkart.",
  openGraph: {
    title: "Company Interview Path | Guru Sishya",
    description:
      "Follow a structured, company-specific interview preparation path for top tech companies.",
    url: "https://www.guru-sishya.in/app/roadmap/company",
  },
};

export default function CompanyPathLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
