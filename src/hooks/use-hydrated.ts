"use client";
import { useEffect, useState } from "react";

/**
 * Returns true once the Zustand store has hydrated from localStorage.
 * Use this to avoid showing "no API key" flash before hydration completes.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
