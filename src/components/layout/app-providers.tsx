"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { useStore } from "@/lib/store";

// ── AllowlistSync ─────────────────────────────────────────────────────────────
// Runs once per session to check whether the signed-in user is on the free-
// premium allowlist and, if so, grants them permanent Pro access.

function AllowlistSync() {
  const { data: session, status } = useSession();
  const checkAllowlistPremium = useStore((s) => s.checkAllowlistPremium);
  const syncWithServer = useStore((s) => s.syncWithServer);
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
  }, [status, session?.user?.email, checkAllowlistPremium, syncWithServer]);

  return null;
}

// ── AppProviders ──────────────────────────────────────────────────────────────

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AllowlistSync />
      {children}
      <Toaster position="bottom-right" theme="dark" />
    </AuthProvider>
  );
}
