"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { FREE_LIMITS } from "@/lib/premium/limits";

interface FeatureLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  label: string;
  increment: () => Promise<boolean>;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function useFeatureLimit(feature: string): FeatureLimitResult {
  const isPremium = useStore((s) => s.isPremium);
  const premiumUntil = useStore((s) => s.premiumUntil);
  const isActivePro = isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();
  const [count, setCount] = useState(0);
  const limits = FREE_LIMITS[feature];
  const dailyLimit = limits?.daily ?? Infinity;
  const label = limits?.label ?? feature;

  useEffect(() => {
    if (isActivePro) return;
    const today = getToday();
    db.usageTracking
      .where({ feature, date: today })
      .first()
      .then((entry) => setCount(entry?.count ?? 0))
      .catch(() => setCount(0));
  }, [feature, isActivePro]);

  const increment = useCallback(async (): Promise<boolean> => {
    if (isActivePro) return true;
    const today = getToday();
    const existing = await db.usageTracking.where({ feature, date: today }).first();
    const currentCount = existing?.count ?? 0;
    if (currentCount >= dailyLimit) return false;
    if (existing) {
      await db.usageTracking.update(existing.id!, { count: currentCount + 1 });
    } else {
      await db.usageTracking.add({ feature, date: today, count: 1 });
    }
    setCount(currentCount + 1);
    return true;
  }, [feature, dailyLimit, isActivePro]);

  if (isActivePro) {
    return { allowed: true, remaining: Infinity, limit: Infinity, label, increment };
  }

  return {
    allowed: count < dailyLimit,
    remaining: Math.max(0, dailyLimit - count),
    limit: dailyLimit,
    label,
    increment,
  };
}
