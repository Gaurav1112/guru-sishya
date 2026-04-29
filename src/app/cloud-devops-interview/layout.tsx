import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cloud & DevOps Interview Questions | Guru Sishya",
  description:
    "Master cloud and DevOps interviews with 20 essential questions on AWS, Docker, Kubernetes, CI/CD, and infrastructure. Free guide with detailed answers.",
  alternates: {
    canonical: "https://www.guru-sishya.in/cloud-devops-interview",
  },
  openGraph: {
    title: "Cloud & DevOps Interview Questions | Guru Sishya",
    description:
      "Master cloud and DevOps interviews with 20 essential questions on AWS, Docker, Kubernetes, CI/CD, and infrastructure. Free guide with detailed answers.",
    url: "https://www.guru-sishya.in/cloud-devops-interview",
    siteName: "Guru Sishya",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "https://www.guru-sishya.in/api/og",
        width: 1200,
        height: 630,
        alt: "Cloud & DevOps Interview Questions | Guru Sishya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cloud & DevOps Interview Questions | Guru Sishya",
    description:
      "Master cloud and DevOps interviews with 20 essential questions on AWS, Docker, Kubernetes, CI/CD, and infrastructure. Free guide with detailed answers.",
  },
};

export default function CloudDevOpsInterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
