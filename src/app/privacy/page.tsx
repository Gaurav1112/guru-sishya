import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Guru Sishya",
  description: "Privacy Policy for Guru Sishya — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: March 24, 2026
        </p>

        <div className="space-y-10 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              1. Overview
            </h2>
            <p>
              Guru Sishya (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, and safeguard your
              information when you use our platform at{" "}
              <span className="text-saffron">guru-sishya.in</span>.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              2. Information We Collect
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <span className="text-foreground font-medium">Local Storage:</span> Your
                learning progress, quiz scores, streaks, XP, and preferences are stored
                entirely in your browser&rsquo;s local storage (IndexedDB / localStorage).
                This data never leaves your device unless you explicitly sync it.
              </li>
              <li>
                <span className="text-foreground font-medium">Google OAuth:</span> If you
                choose to sign in with Google, we receive your name, email address, and
                profile picture from Google. We use this solely to identify your account and
                personalise your experience.
              </li>
              <li>
                <span className="text-foreground font-medium">Payment Information:</span>{" "}
                Subscription payments are processed by Razorpay. We do not store your
                card details. Razorpay&rsquo;s privacy policy governs the handling of
                payment data.
              </li>
              <li>
                <span className="text-foreground font-medium">Usage Data:</span> We may
                collect anonymised analytics (page views, feature usage) to improve the
                platform. No personally identifiable information is included.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>To provide and improve the Guru Sishya platform and its features.</li>
              <li>To authenticate your identity when you sign in.</li>
              <li>To process subscription payments and manage your account.</li>
              <li>To send important service-related communications (e.g., receipts, policy updates).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              4. No Third-Party Data Sharing
            </h2>
            <p>
              We do not sell, rent, or share your personal information with third parties
              for marketing purposes. Data is only shared with service providers strictly
              necessary to operate the platform (Google for authentication, Razorpay for
              payments).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              5. Cookies
            </h2>
            <p>
              We use essential cookies for session management and authentication. We do not
              use tracking or advertising cookies. You can disable cookies in your browser
              settings, but some features (e.g., sign-in) may not function correctly.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              6. Data Retention
            </h2>
            <p>
              Account data is retained as long as your account is active. You may request
              deletion of your account and associated data at any time by contacting us.
              Browser-stored data (localStorage / IndexedDB) can be cleared directly via
              your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              7. Security
            </h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption
              and secure OAuth flows. However, no method of transmission over the internet
              is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              8. Children&rsquo;s Privacy
            </h2>
            <p>
              Guru Sishya is not directed at children under 13. We do not knowingly collect
              personal information from children. If you believe a child has provided us
              personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of
              significant changes by updating the date at the top of this page. Continued
              use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              10. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy or how your data is
              handled, please contact us at:{" "}
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
