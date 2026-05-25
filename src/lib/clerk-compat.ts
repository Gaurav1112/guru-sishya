"use client";

// Client-side compatibility shim — mirrors the NextAuth useSession / signOut API
// so all client components need only an import-path change, not a logic rewrite.

import { useUser, useClerk } from "@clerk/nextjs";

export function useSession() {
  const { user, isLoaded, isSignedIn } = useUser();
  return {
    data:
      isSignedIn && user
        ? {
            user: {
              id: user.id,
              email: user.emailAddresses[0]?.emailAddress ?? "",
              name: user.fullName ?? "",
              image: user.imageUrl ?? "",
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
  const { signOut } = useClerk();
  return (options?: { callbackUrl?: string }) =>
    signOut({ redirectUrl: options?.callbackUrl ?? "/" });
}
