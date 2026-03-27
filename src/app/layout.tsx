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
  themeColor: "#E85D26",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.guru-sishya.in"),
  title: "Guru Sishya — Interview Prep Platform for Software Engineers",
  description:
    "Guru Sishya is a software engineering interview prep platform with 53+ topics, 1290+ questions, adaptive quizzes, Feynman Technique, and AI mock interviews. No credit card needed to start.",
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
  ],
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.guru-sishya.in",
  },
  openGraph: {
    title: "Guru Sishya — Interview Prep Platform for Software Engineers",
    description:
      "Guru Sishya is a software engineering interview prep platform with 53+ topics, 1290+ questions, adaptive quizzes, Feynman Technique, and AI mock interviews. No credit card needed to start.",
    url: "https://www.guru-sishya.in",
    siteName: "Guru Sishya",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "https://www.guru-sishya.in/api/og",
        width: 1200,
        height: 630,
        alt: "Guru Sishya — Interview Prep Platform for Software Engineers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guru Sishya — Interview Prep Platform for Software Engineers",
    description:
      "Guru Sishya is a software engineering interview prep platform with 53+ topics, 1290+ questions, adaptive quizzes, Feynman Technique, and AI mock interviews. No credit card needed to start.",
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
                "Software engineering interview preparation platform with 53 topics, 1290+ questions, and STAR behavioral prep for FAANG interviews.",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "150",
              },
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
              logo: "https://www.guru-sishya.in/icon-512.svg",
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
                    text: "Yes - 56 topics, 710+ quiz questions with answers, 591 full lessons, flashcards, and all progress tracking are free forever. No credit card, no email required. We offer a Pro tier (Rs 129/month or Rs 999/year) for AI-powered features like the Feynman Technique and custom topic generation, but the core prep content will always be free.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do I need an API key or AI subscription?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. All lesson content, quiz questions, cheat sheets, STAR behavioral answers, and the learning ladder are pre-generated and bundled into the app. They work entirely offline in your browser. Only the optional AI features (Feynman Technique, custom topics) require a Pro plan.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What topics does Guru Sishya cover?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "56 topics across four domains: System Design Fundamentals (load balancing, caching, databases, message queues, CDNs), System Design Case Studies (Twitter, YouTube, Uber, etc.), Data Structures and Algorithms (arrays, trees, dynamic programming, graphs), and Core CS (operating systems, networking, databases, compilers). More topics are added regularly.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is Guru Sishya different from LeetCode, AlgoExpert, or NeetCode?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Guru Sishya is the only platform that combines all of this in one place for free: 710+ questions with full answers (not just hints), 58 STAR behavioral answers, 32 system design topics, spaced repetition flashcards, offline access, and Bloom's taxonomy adaptive quizzes. Competitors charge Rs 991-Rs 2917/month and still lack behavioral prep and offline support.",
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
                    text: "Pro (Rs 129/month or Rs 999/year) unlocks AI-powered features: the Feynman Technique interactive chat for deep understanding, custom topic generation, priority support, and a certificate of completion. All core prep content remains free forever.",
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
