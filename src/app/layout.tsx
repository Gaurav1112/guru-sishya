import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#E85D26",
};

export const metadata: Metadata = {
  title: "Guru Sishya — Free Software Engineering Interview Prep | 56 Topics, 710+ Questions",
  description:
    "Crack software engineering interviews with 56 topics, 710+ curated questions, STAR behavioral prep for FAANG, adaptive quizzes, and spaced repetition flashcards. 100% free, works offline.",
  keywords: [
    "software engineering interview prep",
    "coding interview questions",
    "system design interview",
    "java interview questions",
    "FAANG interview preparation",
    "free interview prep",
    "data structures algorithms",
    "behavioral interview STAR method",
  ],
  alternates: {
    canonical: "https://www.guru-sishya.in",
  },
  openGraph: {
    title: "Guru Sishya — Free Software Engineering Interview Prep | 56 Topics, 710+ Questions",
    description:
      "Crack software engineering interviews with 56 topics, 710+ curated questions, STAR behavioral prep for FAANG, adaptive quizzes, and spaced repetition flashcards. 100% free, works offline.",
    url: "https://www.guru-sishya.in",
    siteName: "Guru Sishya",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "https://www.guru-sishya.in/api/og",
        width: 1200,
        height: 630,
        alt: "Guru Sishya — Free Software Engineering Interview Prep",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guru Sishya — Free Software Engineering Interview Prep | 56 Topics, 710+ Questions",
    description:
      "Crack software engineering interviews with 56 topics, 710+ curated questions, STAR behavioral prep for FAANG, adaptive quizzes, and spaced repetition flashcards. 100% free, works offline.",
    images: ["https://www.guru-sishya.in/api/og"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Guru Sishya",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable} dark`}
    >
      <body className="font-body min-h-screen bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Guru Sishya",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
              description: "Free software engineering interview preparation platform",
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
