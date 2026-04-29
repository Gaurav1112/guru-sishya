import { Metadata } from "next";
import { Mail, Clock, Github, MessageSquare, Shield, CreditCard, HelpCircle, BookOpen } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";

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

const FAQ_ITEMS = [
  {
    q: "How do I reset my password?",
    a: 'Go to the login page and click "Forgot password". You will receive a reset link via email within a few minutes.',
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade your plan at any time from Settings. Changes take effect immediately and billing is prorated.",
  },
  {
    q: "How do I request a refund?",
    a: "Email us at gurusishya.in@gmail.com within 7 days of purchase. We offer a no-questions-asked refund policy on all paid plans.",
  },
  {
    q: "Is my progress saved if I cancel?",
    a: "Yes. Your progress, badges, and streaks are preserved. If you re-subscribe later, everything will be exactly as you left it.",
  },
  {
    q: "How do I report a bug?",
    a: "Use the feedback button (bottom-right corner on any page) or fill out the contact form on this page with the \"Technical Issue\" category.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. Visit Settings in your dashboard to export your data or request account deletion. We comply with all applicable data protection regulations.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-3">
            Contact & Support
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Have a question or need help? We are here for you. Fill out the form
            below or reach out directly -- we respond within 24 hours.
          </p>
        </div>

        {/* Quick info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="rounded-xl border border-border/50 bg-surface p-5">
            <Mail className="size-5 text-saffron mb-2" />
            <h3 className="text-sm font-semibold mb-1">Email</h3>
            <a
              href="mailto:gurusishya.in@gmail.com"
              className="text-sm text-saffron hover:underline break-all"
            >
              gurusishya.in@gmail.com
            </a>
          </div>
          <div className="rounded-xl border border-border/50 bg-surface p-5">
            <Clock className="size-5 text-teal mb-2" />
            <h3 className="text-sm font-semibold mb-1">Response Time</h3>
            <p className="text-sm text-muted-foreground">
              Within 24 hours on weekdays. 48 hours on weekends.
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-surface p-5">
            <Github className="size-5 text-muted-foreground mb-2" />
            <h3 className="text-sm font-semibold mb-1">Open Source</h3>
            <a
              href="https://github.com/Gaurav1112/guru-sishya"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-saffron hover:underline"
            >
              GitHub Repository
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Contact Form -- takes 3 cols */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="size-5 text-saffron" />
              Send us a Message
            </h2>
            <div className="rounded-xl border border-border/50 bg-surface p-6">
              <ContactForm />
            </div>
          </div>

          {/* Sidebar -- takes 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Refund Policy */}
            <div className="rounded-xl border border-border/50 bg-surface p-5">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="size-4 text-gold" />
                Refund Policy
              </h3>
              <p className="text-sm text-muted-foreground">
                We offer a <strong>7-day money-back guarantee</strong> on all
                paid plans. If you are not satisfied, email us within 7 days of
                purchase for a full refund. No questions asked.
              </p>
            </div>

            {/* Data & Privacy */}
            <div className="rounded-xl border border-border/50 bg-surface p-5">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Shield className="size-4 text-teal" />
                Data & Privacy
              </h3>
              <p className="text-sm text-muted-foreground">
                To request data export or account deletion, visit{" "}
                <a href="/app/settings" className="text-saffron hover:underline">
                  Settings
                </a>{" "}
                or email us. We comply with all applicable data protection
                regulations.
              </p>
            </div>

            {/* Bug Reports */}
            <div className="rounded-xl border border-border/50 bg-surface p-5">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="size-4 text-saffron" />
                Quick Tips
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Use the feedback widget (bottom-right) for quick bug reports</li>
                <li>Include screenshots or error messages when possible</li>
                <li>Check the FAQ below before contacting support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-16">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <HelpCircle className="size-5 text-saffron" />
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-border/50 bg-surface p-5"
              >
                <h3 className="text-sm font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
