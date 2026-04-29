import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Support",
  description:
    "Get help with Guru Sishya. Contact our support team for technical issues, billing questions, feedback, or refund requests. We respond within 24 hours.",
  alternates: { canonical: "https://www.guru-sishya.in/contact" },
  openGraph: {
    title: "Contact & Support | Guru Sishya",
    description:
      "Reach the Guru Sishya support team for technical issues, billing, or feedback. We respond within 24 hours.",
    url: "https://www.guru-sishya.in/contact",
    type: "website",
    siteName: "Guru Sishya",
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="font-heading text-3xl font-bold mb-6">Contact & Support</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">Email Support</h2>
            <p className="text-muted-foreground mb-2">
              For billing, technical issues, or account help:
            </p>
            <a href="mailto:gurusishya.in@gmail.com" className="text-saffron hover:underline text-lg">
              gurusishya.in@gmail.com
            </a>
            <p className="text-sm text-muted-foreground mt-1">We respond within 24 hours.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Refund Policy</h2>
            <p className="text-muted-foreground">
              We offer a 7-day money-back guarantee on all paid plans. If you are not satisfied,
              email us within 7 days of purchase for a full refund. No questions asked.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Bug Reports & Feedback</h2>
            <p className="text-muted-foreground">
              Found a bug or have a suggestion? Email us at{" "}
              <a href="mailto:feedback@guru-sishya.in" className="text-saffron hover:underline">
                feedback@guru-sishya.in
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data & Privacy</h2>
            <p className="text-muted-foreground">
              To request data export or account deletion, visit{" "}
              <a href="/app/settings" className="text-saffron hover:underline">Settings</a>
              {" "}or email us. We comply with all applicable data protection regulations.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
