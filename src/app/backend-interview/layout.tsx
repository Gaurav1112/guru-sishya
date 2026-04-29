import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backend Engineering Interview Questions | Guru Sishya",
  description:
    "Prepare for backend interviews with 20 essential questions on APIs, microservices, caching, authentication, and message queues. Free detailed guide.",
  alternates: {
    canonical: "https://www.guru-sishya.in/backend-interview",
  },
  openGraph: {
    title: "Backend Engineering Interview Questions | Guru Sishya",
    description:
      "Prepare for backend interviews with 20 essential questions on APIs, microservices, caching, authentication, and message queues. Free detailed guide.",
    url: "https://www.guru-sishya.in/backend-interview",
    siteName: "Guru Sishya",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "https://www.guru-sishya.in/api/og",
        width: 1200,
        height: 630,
        alt: "Backend Engineering Interview Questions | Guru Sishya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Backend Engineering Interview Questions | Guru Sishya",
    description:
      "Prepare for backend interviews with 20 essential questions on APIs, microservices, caching, authentication, and message queues. Free detailed guide.",
  },
};

export default function BackendInterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
