import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Database Interview Questions | Guru Sishya",
  description:
    "Ace database interviews with 20 essential questions on SQL, NoSQL, indexing, ACID, sharding, and query optimization. Free guide with detailed answers.",
  alternates: {
    canonical: "https://www.guru-sishya.in/database-interview",
  },
  openGraph: {
    title: "Database Interview Questions | Guru Sishya",
    description:
      "Ace database interviews with 20 essential questions on SQL, NoSQL, indexing, ACID, sharding, and query optimization. Free guide with detailed answers.",
    url: "https://www.guru-sishya.in/database-interview",
    siteName: "Guru Sishya",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "https://www.guru-sishya.in/api/og",
        width: 1200,
        height: 630,
        alt: "Database Interview Questions | Guru Sishya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Database Interview Questions | Guru Sishya",
    description:
      "Ace database interviews with 20 essential questions on SQL, NoSQL, indexing, ACID, sharding, and query optimization. Free guide with detailed answers.",
  },
};

export default function DatabaseInterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
