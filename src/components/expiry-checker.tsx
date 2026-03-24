"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Invisible component that runs checkPremiumExpiry() once on every page load.
 * Placed in the app layout so it fires on every navigation within the app shell.
 */
export function ExpiryChecker() {
  const checkPremiumExpiry = useStore((s) => s.checkPremiumExpiry);

  useEffect(() => {
    checkPremiumExpiry();
  }, [checkPremiumExpiry]);

  return null;
}
