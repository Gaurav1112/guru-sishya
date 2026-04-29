import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Configure your Guru Sishya experience. Manage AI providers, theme preferences, notification settings, and data export options.",
  openGraph: {
    title: "Settings | Guru Sishya",
    description:
      "Configure your Guru Sishya experience. Manage AI providers, theme preferences, and data options.",
    url: "https://www.guru-sishya.in/app/settings",
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
