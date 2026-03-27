"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { useStore } from "@/lib/store";
import { TourProvider } from "@/components/onboarding/tour-provider";
import { StickyUpgradeBar } from "@/components/pricing/sticky-upgrade-bar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServerProgress {
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  coins: number;
  topics_completed?: number;
  quizzes_taken?: number;
}

// ── AllowlistSync ─────────────────────────────────────────────────────────────
// Runs once per session to check whether the signed-in user is on the free-
// premium allowlist and, if so, grants them permanent Pro access.

function AllowlistSync() {
  const { data: session, status } = useSession();
  const checkAllowlistPremium = useStore((s) => s.checkAllowlistPremium);
  const syncWithServer = useStore((s) => s.syncWithServer);
  const set = useStore.setState;
  const checkedEmail = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email;
    // Only run once per email to avoid redundant fetches
    if (email === checkedEmail.current) return;
    checkedEmail.current = email;

    // Run allowlist check first, then sync with Supabase subscription record
    checkAllowlistPremium(email).then(() => {
      syncWithServer(email);
    });

    // Load game progress from Supabase on sign-in.
    // If the server has a higher XP than what's in localStorage, restore from
    // server — this covers new device, cleared browser, different browser.
    if (email) {
      fetch(`/api/user/progress?email=${encodeURIComponent(email)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((serverData: ServerProgress | null) => {
          if (!serverData) return;
          const localXP = useStore.getState().totalXP;
          if (serverData.total_xp > localXP) {
            set({
              totalXP: serverData.total_xp,
              level: serverData.level,
              currentStreak: serverData.current_streak,
              longestStreak: serverData.longest_streak,
              coins: serverData.coins,
            });
          }
        })
        .catch(() => {
          // Silently ignore — localStorage remains the fallback
        });
    }
  // totalXP is intentionally excluded: this effect must run once per email,
  // not on every XP change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.email, checkAllowlistPremium, syncWithServer, set]);

  return null;
}

// ── ProgressSync ──────────────────────────────────────────────────────────────
// Watches XP/level/streak/coins in Zustand and debounces saves to Supabase.
// Only active for signed-in users; localStorage still handles the unauthenticated
// case via Zustand persist middleware.

function ProgressSync() {
  const totalXP = useStore((s) => s.totalXP);
  const level = useStore((s) => s.level);
  const currentStreak = useStore((s) => s.currentStreak);
  const longestStreak = useStore((s) => s.longestStreak);
  const coins = useStore((s) => s.coins);
  const { data: session } = useSession();
  const email = session?.user?.email;

  useEffect(() => {
    if (!email) return;

    const timer = setTimeout(() => {
      fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          total_xp: totalXP,
          level,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          coins,
          // topics_completed and quizzes_taken are tracked server-side separately;
          // pass 0 as a safe default so the column is never null.
          topics_completed: 0,
          quizzes_taken: 0,
        }),
      }).catch(() => {
        // Fire-and-forget — silently ignore network failures
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [email, totalXP, level, currentStreak, longestStreak, coins]);

  return null;
}

// ── AppProviders ──────────────────────────────────────────────────────────────

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AllowlistSync />
      <ProgressSync />
      <TourProvider>{children}</TourProvider>
      <StickyUpgradeBar />
      <Toaster position="bottom-right" theme="dark" />
    </AuthProvider>
  );
}
