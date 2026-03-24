import { AppProviders } from "@/components/layout/app-providers";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { CelebrationOverlay } from "@/components/gamification/celebration-overlay";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { ExpiryChecker } from "@/components/expiry-checker";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      {/* Runs checkPremiumExpiry() on every page load (client-side only) */}
      <ExpiryChecker />
      <div className="flex h-screen flex-col">
        <Topbar />
        {/* Subscription warning banner sits between topbar and content */}
        <SubscriptionBanner />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
        </div>
      </div>
      <CelebrationOverlay />
    </AppProviders>
  );
}
