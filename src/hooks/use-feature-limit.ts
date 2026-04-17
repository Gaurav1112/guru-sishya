"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { FREE_LIMITS, STARTER_LIMITS } from "@/lib/premium/limits";

interface FeatureLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  label: string;
  /** Increment usage (client + server). Returns true if action is allowed. */
  increment: () => Promise<boolean>;
  /**
   * Verify with the server whether the action is allowed. Use this to gate
   * high-value actions (quiz start, Guru Mode start, etc.) without making
   * every interaction wait for a network call.
   *
   * Returns true if the server confirms the action is allowed, or if the
   * server is unavailable (graceful degradation -- client-side is the fallback).
   */
  verifyWithServer: () => Promise<boolean>;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Server-side usage check. Returns { allowed, remaining, limit } from the
 * server, or null if the server is unreachable / not configured.
 */
async function serverCheck(
  feature: string
): Promise<{ allowed: boolean; remaining: number; limit: number } | null> {
  try {
    const res = await fetch("/api/usage/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Server-side usage increment. Returns { success, remaining, limit } from
 * the server, or null if unreachable.
 */
async function serverIncrement(
  feature: string
): Promise<{ success: boolean; remaining: number; limit: number } | null> {
  try {
    const res = await fetch("/api/usage/increment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function useFeatureLimit(feature: string): FeatureLimitResult {
  const isPremium = useStore((s) => s.isPremium);
  const premiumUntil = useStore((s) => s.premiumUntil);
  const planType = useStore((s) => s.planType);
  const isActivePro = isPremium && premiumUntil != null && new Date(premiumUntil) > new Date() && planType !== "starter";
  const isActiveStarter = isPremium && premiumUntil != null && new Date(premiumUntil) > new Date() && planType === "starter";
  const [count, setCount] = useState(0);
  const [serverDenied, setServerDenied] = useState(false);

  // Starter tier uses its own limits; free tier uses FREE_LIMITS; Pro bypasses all
  const limits = isActiveStarter
    ? (STARTER_LIMITS[feature] ?? FREE_LIMITS[feature])
    : FREE_LIMITS[feature];
  const dailyLimit = limits?.daily ?? Infinity;
  const label = limits?.label ?? feature;

  // Track whether a server verification has been attempted this session
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (isActivePro) return; // Pro users bypass all limits
    const today = getToday();
    db.usageTracking
      .where({ feature, date: today })
      .first()
      .then((entry) => setCount(entry?.count ?? 0))
      .catch(() => setCount(0));
  }, [feature, isActivePro, isActiveStarter]);

  // Server verification (for gating high-value actions)
  const verifyWithServer = useCallback(async (): Promise<boolean> => {
    if (isActivePro) return true;

    const result = await serverCheck(feature);
    if (result === null) {
      // Server unreachable -- fall back to client-side decision
      return count < dailyLimit;
    }

    verifiedRef.current = true;

    // If server says NOT allowed but client thinks it IS -- trust server
    if (!result.allowed) {
      setServerDenied(true);
      return false;
    }

    // Server says allowed -- clear any previous server denial
    setServerDenied(false);
    return true;
  }, [feature, isActivePro, count, dailyLimit]);

  // Increment (client-side fast path + server-side fire)
  const increment = useCallback(async (): Promise<boolean> => {
    if (isActivePro) return true;

    // Client-side fast check
    const today = getToday();
    const canProceed = await db.transaction("rw", db.usageTracking, async () => {
      const existing = await db.usageTracking.where({ feature, date: today }).first();
      const currentCount = existing?.count ?? 0;
      if (currentCount >= dailyLimit) return false;
      if (existing) {
        await db.usageTracking.update(existing.id!, { count: currentCount + 1 });
      } else {
        await db.usageTracking.add({ feature, date: today, count: 1 });
      }
      return true;
    });

    if (!canProceed) return false;

    setCount((prev) => prev + 1);

    // Fire server increment in background -- don't block the user
    serverIncrement(feature).then((result) => {
      if (result && !result.success) {
        // Server says limit exceeded (user may have tampered with client DB).
        // Mark as denied so subsequent checks fail.
        setServerDenied(true);
      }
    }).catch(() => {
      // Server unreachable -- client tracking is the fallback
    });

    return true;
  }, [feature, dailyLimit, isActivePro]);

  if (isActivePro) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
      label,
      increment,
      verifyWithServer,
    };
  }

  // If server has explicitly denied, override client-side "allowed"
  const clientAllowed = count < dailyLimit;
  const allowed = serverDenied ? false : clientAllowed;

  return {
    allowed,
    remaining: serverDenied ? 0 : Math.max(0, dailyLimit - count),
    limit: dailyLimit,
    label,
    increment,
    verifyWithServer,
  };
}
