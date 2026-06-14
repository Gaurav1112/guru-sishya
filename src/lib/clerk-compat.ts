"use client";

// Client-side compatibility shim — mirrors the NextAuth useSession / signOut API
// so all client components need only an import-path change, not a logic rewrite.

import { useAuth } from "@clerk/astro/react";

export function useSession() {
  const { userId, isLoaded, isSignedIn, sessionClaims } = useAuth();

  // Build a minimal session-like object from auth claims
  const email =
    (sessionClaims?.email as string | undefined) ??
    (sessionClaims?.primary_email_address as string | undefined) ??
    "";
  const name = (sessionClaims?.name as string | undefined) ?? "";
  const image = (sessionClaims?.image_url as string | undefined) ?? "";

  return {
    data:
      isSignedIn && userId
        ? {
            user: {
              id: userId,
              email,
              name,
              image,
            },
          }
        : null,
    status: !isLoaded
      ? ("loading" as const)
      : isSignedIn
        ? ("authenticated" as const)
        : ("unauthenticated" as const),
  };
}

export function useSignOut() {
  const { signOut } = useAuth();
  return (options?: { callbackUrl?: string }) =>
    signOut({ redirectUrl: options?.callbackUrl ?? "/" });
}
