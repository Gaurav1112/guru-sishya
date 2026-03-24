import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Playground | Guru Sishya",
  description:
    "Write, run, and test code directly in your browser. Practice coding interview problems in Python, JavaScript, and TypeScript with instant execution.",
  openGraph: {
    title: "Code Playground | Guru Sishya",
    description:
      "Write, run, and test code directly in your browser. Practice coding interview problems in Python, JavaScript, and TypeScript.",
    url: "https://www.guru-sishya.in/app/playground",
  },
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
