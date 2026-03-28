import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Guru Sishya",
  description: "Terms of Service for Guru Sishya — rules governing use of the platform.",
  alternates: { canonical: "https://www.guru-sishya.in/terms" },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-saffron transition-colors mb-8 inline-block"
        >
          &larr; Back to Home
        </Link>

        <h1 className="font-heading text-3xl font-bold text-saffron mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: March 24, 2026
        </p>

        <div className="space-y-10 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Guru Sishya (&ldquo;the Service&rdquo;), you agree to be bound
              by these Terms of Service. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              2. Account Usage
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>You must be at least 13 years old to create an account.</li>
              <li>
                You are responsible for maintaining the confidentiality of your account
                credentials and for all activity that occurs under your account.
              </li>
              <li>
                You agree not to use the Service for any unlawful purpose, to disrupt the
                platform, or to infringe on the rights of others.
              </li>
              <li>
                We reserve the right to suspend or terminate accounts that violate these
                Terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              3. Free Tier
            </h2>
            <p>
              The core features of Guru Sishya — including all topics, quiz questions, and
              learning sessions — are provided free of charge. No credit card is required
              to access free features. We reserve the right to modify what is included in
              the free tier with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              4. Subscription Billing
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                Premium subscriptions are billed on a monthly or annual basis, as selected
                at checkout. Payments are processed securely by Razorpay.
              </li>
              <li>
                Subscriptions auto-renew at the end of each billing period unless cancelled
                before the renewal date.
              </li>
              <li>
                You may cancel your subscription at any time from your account settings.
                Cancellation takes effect at the end of the current billing period; you
                retain access to premium features until then.
              </li>
              <li>
                Prices are listed in Indian Rupees (INR) and are subject to applicable taxes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              5. Refund Policy
            </h2>
            <p>
              We offer a <span className="text-foreground font-semibold">7-day money-back guarantee</span>{" "}
              on all new subscriptions. If you are not satisfied within the first 7 days of
              your paid subscription, contact us at{" "}
              <a
                href="mailto:kgauravis016@gmail.com"
                className="text-saffron hover:underline"
              >
                kgauravis016@gmail.com
              </a>{" "}
              for a full refund. Refunds are not available for renewals or after the 7-day
              window has passed.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              6. Intellectual Property
            </h2>
            <p>
              All content on Guru Sishya — including but not limited to text, quiz
              questions, lesson material, code examples, graphics, and the software itself —
              is the intellectual property of Guru Sishya and is protected by applicable
              copyright laws. You may use the content for personal, non-commercial
              learning purposes only. You may not reproduce, redistribute, or sell any
              content from the platform without explicit written permission.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              7. Disclaimer of Warranties
            </h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express
              or implied. We do not guarantee that the Service will be uninterrupted,
              error-free, or that the content will always be accurate or up to date. Use
              of the Service is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              8. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Guru Sishya shall not be liable for
              any indirect, incidental, special, or consequential damages arising from your
              use of the Service, including but not limited to loss of data or loss of
              revenue.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              9. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you
              of material changes by updating the date at the top of this page. Continued
              use of the Service after changes are posted constitutes your acceptance of
              the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              10. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of India. Any disputes arising from
              these Terms shall be subject to the exclusive jurisdiction of the courts
              located in India.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              11. Contact Us
            </h2>
            <p>
              Questions about these Terms? Reach us at:{" "}
              <a
                href="mailto:kgauravis016@gmail.com"
                className="text-saffron hover:underline"
              >
                kgauravis016@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
