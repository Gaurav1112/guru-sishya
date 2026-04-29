import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coin Shop",
  description:
    "Spend earned coins on themes, badges, and power-ups. Reward yourself for consistent interview preparation progress.",
  openGraph: {
    title: "Coin Shop | Guru Sishya",
    description:
      "Spend earned coins on themes, badges, and power-ups. Reward yourself for consistent interview preparation progress.",
    url: "https://www.guru-sishya.in/app/shop",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
