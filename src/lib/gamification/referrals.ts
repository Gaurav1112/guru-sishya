// ────────────────────────────────────────────────────────────────────────────
// Referral system — generates codes, tracks referrals, awards milestones
// ────────────────────────────────────────────────────────────────────────────

import { useStore } from "@/lib/store";

// ── Constants ───────────────────────────────────────────────────────────────

const REFERRAL_STORAGE_KEY = "gs-referral";
const PENDING_REFERRAL_KEY = "gs-pending-referral";

/** Reward tiers: referralCount -> reward definition */
export const REFERRAL_TIERS = [
  { count: 1, label: "1 referral", xp: 100, coins: 50, proDays: 0, badge: null },
  { count: 3, label: "3 referrals", xp: 0, coins: 0, proDays: 7, badge: null },
  { count: 5, label: "5 referrals", xp: 0, coins: 0, proDays: 0, badge: "guru_ambassador" },
  { count: 10, label: "10 referrals", xp: 0, coins: 0, proDays: 30, badge: null },
] as const;

// ── Types ───────────────────────────────────────────────────────────────────

export interface ReferralData {
  /** The user's unique 6-char referral code */
  code: string;
  /** Number of friends who have joined via this code */
  referredCount: number;
  /** Which tier reward counts have already been claimed */
  claimedTiers: number[];
  /** ISO date when the code was created */
  createdAt: string;
}

// ── Code generation ─────────────────────────────────────────────────────────

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1

function generateCode(): string {
  let code = "";
  const arr = new Uint8Array(6);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 6; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[arr[i] % ALPHABET.length];
  }
  return code;
}

// ── Storage helpers ─────────────────────────────────────────────────────────

/**
 * Get or create the current user's referral data from localStorage.
 */
export function getReferralData(): ReferralData {
  if (typeof window === "undefined") {
    return {
      code: "------",
      referredCount: 0,
      claimedTiers: [],
      createdAt: new Date().toISOString(),
    };
  }

  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as ReferralData;
    }
  } catch {
    // corrupt data — regenerate
  }

  // First time — generate a new code
  const data: ReferralData = {
    code: generateCode(),
    referredCount: 0,
    claimedTiers: [],
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full
  }

  return data;
}

/**
 * Save updated referral data to localStorage.
 */
function saveReferralData(data: ReferralData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ── Pending referral (for the referred user) ────────────────────────────────

/**
 * Store a referral code when a new user arrives via /ref/[code].
 * This is read later to credit the referrer.
 */
export function storePendingReferral(code: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PENDING_REFERRAL_KEY, code.toUpperCase());
  } catch {
    // ignore
  }
}

/**
 * Read and consume the pending referral code (if any).
 * Returns the code or null.
 */
export function consumePendingReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const code = localStorage.getItem(PENDING_REFERRAL_KEY);
    if (code) {
      localStorage.removeItem(PENDING_REFERRAL_KEY);
    }
    return code;
  } catch {
    return null;
  }
}

// ── Referral tracking ───────────────────────────────────────────────────────

/**
 * Called when a referred user starts using the app.
 * Marks this user as referred and gives them a welcome bonus.
 * Returns true if the referral was recorded.
 */
export function recordReferral(referrerCode: string): boolean {
  if (typeof window === "undefined") return false;

  const myData = getReferralData();

  // Don't allow self-referral
  if (myData.code === referrerCode.toUpperCase()) return false;

  // Check if this user has already been counted as a referral
  const COUNTED_KEY = "gs-referral-counted";
  try {
    if (localStorage.getItem(COUNTED_KEY)) return false;
  } catch {
    // ignore
  }

  // Mark that this user was referred (so we don't double-count)
  try {
    localStorage.setItem(COUNTED_KEY, referrerCode.toUpperCase());
  } catch {
    // ignore
  }

  // Give the referred user a welcome bonus
  const store = useStore.getState();
  store.addXP(50);
  store.addCoins(25, "Referral welcome bonus");

  return true;
}

// ── Increment referrer count ────────────────────────────────────────────────

/**
 * Increment the referrer's count. In a real system this would be
 * a server callback. For the client-only version, the referrer
 * can also increment manually from the referral page.
 */
export function incrementReferralCount(): ReferralData {
  const data = getReferralData();
  data.referredCount += 1;
  saveReferralData(data);
  return data;
}

// ── Reward claiming ─────────────────────────────────────────────────────────

export interface ClaimResult {
  success: boolean;
  tier: (typeof REFERRAL_TIERS)[number] | null;
  message: string;
}

/**
 * Claim all unclaimed tier rewards based on current referredCount.
 * Returns an array of claimed rewards.
 */
export function claimReferralRewards(): ClaimResult[] {
  const data = getReferralData();
  const results: ClaimResult[] = [];
  const store = useStore.getState();

  for (const tier of REFERRAL_TIERS) {
    if (
      data.referredCount >= tier.count &&
      !data.claimedTiers.includes(tier.count)
    ) {
      // Mark as claimed
      data.claimedTiers.push(tier.count);

      // Grant XP
      if (tier.xp > 0) {
        store.addXP(tier.xp);
      }

      // Grant coins
      if (tier.coins > 0) {
        store.addCoins(tier.coins, `Referral reward: ${tier.label}`);
      }

      // Grant Pro days
      if (tier.proDays > 0) {
        const current = store.premiumUntil;
        const base =
          current && new Date(current) > new Date()
            ? new Date(current)
            : new Date();
        const newExpiry = new Date(base);
        newExpiry.setDate(newExpiry.getDate() + tier.proDays);
        store.setPremiumStatus(
          true,
          newExpiry.toISOString(),
          "referral_reward",
          "referral_reward"
        );
      }

      results.push({
        success: true,
        tier,
        message:
          tier.proDays > 0
            ? `${tier.proDays} days of Pro access unlocked!`
            : tier.badge
              ? "Guru Ambassador badge unlocked!"
              : `+${tier.xp} XP and +${tier.coins} coins earned!`,
      });
    }
  }

  saveReferralData(data);
  return results;
}

/**
 * Get unclaimed rewards the user is eligible for.
 */
export function getUnclaimedRewards(): (typeof REFERRAL_TIERS)[number][] {
  const data = getReferralData();
  return REFERRAL_TIERS.filter(
    (tier) =>
      data.referredCount >= tier.count &&
      !data.claimedTiers.includes(tier.count)
  );
}

/**
 * Build the full referral URL for sharing.
 */
export function getReferralUrl(code: string): string {
  return `https://guru-sishya.in/ref/${code}`;
}
