"use client";

// Auth stubs — login is disabled, all users are treated as guests

interface SessionUser {
  id: string;
  email: string;
  name: string;
  image: string;
}

interface SessionData {
  user: SessionUser;
}

export function useSession(): {
  data: SessionData | null;
  status: "loading" | "authenticated" | "unauthenticated";
} {
  return {
    data: null,
    status: "unauthenticated",
  };
}

export function useSignOut() {
  return (_options?: { callbackUrl?: string }) => Promise.resolve();
}
