import { AppProviders } from "@/components/layout/app-providers";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { CelebrationOverlay } from "@/components/gamification/celebration-overlay";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { ExpiryChecker } from "@/components/expiry-checker";
import { MitraChat } from "@/components/mitra-chat";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-saffron focus:px-4 focus:py-2 focus:text-background focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
      {/* Runs checkPremiumExpiry() on every page load (client-side only) */}
      <ExpiryChecker />
      <div className="flex h-screen flex-col">
        <Topbar />
        {/* Subscription warning banner sits between topbar and content */}
        <SubscriptionBanner />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main id="main-content" className="flex-1 overflow-y-auto p-3 pb-20 sm:p-4 sm:pb-4 md:p-6">{children}</main>
        </div>
      </div>
      <MobileTabBar />
      <CelebrationOverlay />
      <MitraChat />
      <FeedbackWidget />
    </AppProviders>
  );
}
