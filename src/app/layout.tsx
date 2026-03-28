import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
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
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#E85D26",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.guru-sishya.in"),
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  },
  title: "DSA, System Design & Behavioral Interview Prep | Guru Sishya",
  description:
    "Practice 1988 DSA, system design & behavioral interview questions. Mock interviews, STAR method, FAANG company prep paths & adaptive quizzes. Free platform with Java + Python code.",
  keywords: [
    "software engineering interview prep",
    "coding interview questions",
    "system design interview",
    "java interview questions",
    "FAANG interview preparation",
    "interview preparation platform",
    "data structures algorithms",
    "behavioral interview STAR method",
    "DSA interview questions",
    "software engineer interview India",
    "coding interview preparation",
    "system design interview questions",
    "MAANG interview preparation India",
    "dynamic programming interview",
    "technical interview preparation",
    "placement preparation India",
    "software developer interview tips",
    "react interview questions",
    "node.js interview questions",
    "python interview questions",
    "microservices interview",
    "mock interview practice",
    "interview questions with answers",
    "spring boot interview questions",
    "DSA preparation platform",
    "system design interview prep",
    "FAANG interview practice",
    "leetcode alternative free",
    "best free interview prep platform",
    "system design questions with answers",
    "coding interview preparation free",
    "guru sishya",
  ],
  icons: {
    icon: [
      { url: "/logo-mark.png", type: "image/png" },
      { url: "/logo-mark.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/logo-mark.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/logo-mark.png",
  },
  authors: [{ name: "Guru Sishya", url: "https://www.guru-sishya.in" }],
  creator: "Guru Sishya",
  publisher: "Guru Sishya",
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  alternates: {
    canonical: "https://www.guru-sishya.in",
  },
  openGraph: {
    title: "DSA, System Design & Behavioral Interview Prep | Guru Sishya",
    description:
      "Practice 1988 DSA, system design & behavioral interview questions. Mock interviews, STAR method, FAANG company prep paths & adaptive quizzes. Free with Java + Python code.",
    url: "https://www.guru-sishya.in",
    siteName: "Guru Sishya",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "https://www.guru-sishya.in/api/og",
        width: 1200,
        height: 630,
        alt: "Guru Sishya — DSA + System Design Interview Prep Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DSA, System Design & Behavioral Interview Prep | Guru Sishya",
    description:
      "Practice 1988 DSA, system design & behavioral interview questions. Mock interviews, STAR method, FAANG company prep paths & adaptive quizzes. Free with Java + Python code.",
    images: ["https://www.guru-sishya.in/api/og"],
  },
  category: "education",
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
      <head>
        {/* Preconnect to external origins for faster resource loading */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="font-body min-h-screen bg-background">
        {/* JSON-LD: SoftwareApplication */}
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
              description:
                "Software engineering interview preparation platform with 138 topics, 1933 questions, and STAR behavioral prep for FAANG interviews.",
              url: "https://www.guru-sishya.in",
            }),
          }}
        />
        {/* JSON-LD: WebSite with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Guru Sishya",
              url: "https://www.guru-sishya.in",
              description:
                "Software engineering interview preparation platform for Indian developers targeting FAANG and top tech companies.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://www.guru-sishya.in/app/topics?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
              inLanguage: "en-IN",
            }),
          }}
        />
        {/* JSON-LD: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Guru Sishya",
              url: "https://www.guru-sishya.in",
              logo: "https://www.guru-sishya.in/logo-mark.png",
              sameAs: ["https://github.com/Gaurav1112/guru-sishya"],
              contactPoint: {
                "@type": "ContactPoint",
                email: "kgauravis016@gmail.com",
                contactType: "customer support",
              },
            }),
          }}
        />
        {/* JSON-LD: FAQPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Is Guru Sishya really free? What's the catch?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes - 141 topics, 1988 quiz questions with answers, 693 full sessions, flashcards, and all progress tracking are free forever. No credit card, no email required. We offer a Pro tier (Rs 149/month or Rs 1199/year) for AI-powered features like the Guru Mode and custom topic generation, but the core prep content will always be free.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do I need an API key or AI subscription?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. All lesson content, quiz questions, quick saar notes, STAR behavioral answers, and the learning ladder are pre-generated and bundled into the app. They work entirely offline in your browser. Only the optional AI features (Guru Mode, custom topics) require a Pro plan.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What topics does Guru Sishya cover?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "138 topics across four domains: System Design Fundamentals (load balancing, caching, databases, message queues, CDNs), System Design Case Studies (Twitter, YouTube, Uber, etc.), Data Structures and Algorithms (arrays, trees, dynamic programming, graphs), and Core CS (operating systems, networking, databases, compilers). More topics are added regularly.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is Guru Sishya different from LeetCode, AlgoExpert, or NeetCode?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Guru Sishya is the only platform that combines all of this in one place for free: 1933 questions with full answers (not just hints), 58 STAR behavioral answers, 32 system design topics, spaced repetition flashcards, offline access, and Bloom's taxonomy adaptive quizzes. Competitors charge Rs 991-Rs 2917/month and still lack behavioral prep and offline support.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Does Guru Sishya cover behavioral interviews?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Guru Sishya includes 58 pre-written STAR behavioral answers for the most common interview questions at Google, Amazon, Microsoft, Meta, Apple, and Netflix. These cover leadership, conflict resolution, ownership, impact, and more.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Will my progress be saved?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. All progress is saved locally in your browser using IndexedDB - no account required. Your data is private and works offline. If you clear your browser data, your progress will reset.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is the Pro plan and what does it include?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Pro (Rs 149/month or Rs 1199/year) unlocks AI-powered features: the Guru Mode interactive chat for deep understanding, custom topic generation, priority support, and a certificate of completion. All core prep content remains free forever.",
                  },
                },
              ],
            }),
          }}
        />
        {children}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
