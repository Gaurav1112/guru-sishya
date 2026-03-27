import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SignInForm } from "./signin-form";

export const metadata = {
  title: "Sign In — Guru Sishya",
  description: "Sign in to Guru Sishya to sync your interview prep progress across devices, track badges, and join the leaderboard.",
};


export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // If already signed in, redirect to dashboard (or callbackUrl)
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/app/dashboard";

  if (session) {
    redirect(callbackUrl);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-saffron/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-teal/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="font-heading text-2xl font-black text-saffron tracking-wider">
            GURU SISHYA
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/50 bg-surface p-8 shadow-xl shadow-black/20">
          <h1 className="font-heading text-2xl font-bold text-center mb-2">
            Welcome back
          </h1>
          <p className="text-center text-sm text-muted-foreground mb-8">
            Sign in to sync your progress across all devices
          </p>

          {/* Value props */}
          <ul className="mb-8 space-y-2 text-sm text-muted-foreground">
            {[
              { icon: "📊", text: "Track your progress across devices" },
              { icon: "🏆", text: "Appear on the leaderboard with your name" },
              { icon: "🔔", text: "Weekly & monthly review reminders" },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <span className="text-base leading-none">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          {/* Sign in — posts directly to @auth/core endpoint */}
          <SignInForm callbackUrl={callbackUrl} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Link href="/app/topics">
            <Button variant="ghost" className="w-full h-10 text-muted-foreground hover:text-foreground">
              Continue without account
            </Button>
          </Link>

          <p className="mt-4 text-center text-xs text-muted-foreground/60">
            No credit card required &bull; Fully free, forever
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/50">
          Your data stays local even without signing in.
          <br />
          Sign in only unlocks cross-device sync.
        </p>
      </div>
    </div>
  );
}
