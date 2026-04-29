"use client";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns true once the Zustand store has hydrated from localStorage.
 * Use this to avoid showing "no API key" flash before hydration completes.
 *
 * Uses useSyncExternalStore to return true on the very first client render,
 * eliminating the extra render cycle that useState+useEffect required
 * (which caused an unnecessary loading spinner flash).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,   // client: always hydrated
    () => false,   // server: not hydrated
  );
}
